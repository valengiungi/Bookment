import { addMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { BookingStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { buildBookingFinancialSnapshots } from "@/lib/staff-commissions";
import { jsDayOfWeekForYmd, POST_SERVICE_BUFFER_MINUTES } from "@/modules/calendar/slots";
import { defaultTimeZone } from "@/lib/timezone";
import { staffOffersService } from "@/lib/staff-services";

export type UpdateBookingInput = {
  bookingId: string;
  tenantId: string;
  serviceId: string;
  staffId: string;
  startsAt: Date;
  timeZone?: string;
};

export async function updateBooking(input: UpdateBookingInput) {
  const tz = input.timeZone ?? defaultTimeZone;

  const existing = await prisma.booking.findFirst({
    where: {
      id: input.bookingId,
      tenantId: input.tenantId,
      status: BookingStatus.CONFIRMED,
    },
  });
  if (!existing) {
    return { ok: false as const, code: "BOOKING_NOT_FOUND" as const };
  }

  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, tenantId: input.tenantId, active: true },
  });
  if (!service) {
    return { ok: false as const, code: "SERVICE_NOT_FOUND" as const };
  }

  const staff = await prisma.staff.findFirst({
    where: { id: input.staffId, tenantId: input.tenantId, active: true },
  });
  if (!staff) {
    return { ok: false as const, code: "STAFF_NOT_FOUND" as const };
  }

  const tenantMode = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: { sameServicesAllStaff: true },
  });
  const shared = tenantMode?.sameServicesAllStaff ?? true;
  const offers = await staffOffersService(
    prisma,
    input.tenantId,
    shared,
    input.staffId,
    input.serviceId,
  );
  if (!offers) {
    return { ok: false as const, code: "SERVICE_STAFF_MISMATCH" as const };
  }

  const endsAt = addMinutes(
    input.startsAt,
    service.durationMinutes + POST_SERVICE_BUFFER_MINUTES,
  );
  const ymd = formatInTimeZone(input.startsAt, tz, "yyyy-MM-dd");
  const dow = jsDayOfWeekForYmd(ymd, tz);

  const hours = await prisma.workingHour.findMany({
    where: { tenantId: input.tenantId, OR: [{ staffId: null }, { staffId: input.staffId }] },
  });
  const staffFirst = hours.filter((h) => h.staffId === input.staffId && h.dayOfWeek === dow);
  const dayHours = staffFirst.length
    ? staffFirst[0]
    : hours.find((h) => h.staffId === null && h.dayOfWeek === dow);
  if (!dayHours) {
    return { ok: false as const, code: "CLOSED_DAY" as const };
  }

  const opens = dayHours.opensAt;
  const closes = dayHours.closesAt;
  const startLabel = formatInTimeZone(input.startsAt, tz, "HH:mm");
  const endLabel = formatInTimeZone(endsAt, tz, "HH:mm");
  if (startLabel < opens || endLabel > closes) {
    return { ok: false as const, code: "OUTSIDE_HOURS" as const };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const overlap = await tx.booking.count({
        where: {
          id: { not: input.bookingId },
          staffId: input.staffId,
          status: BookingStatus.CONFIRMED,
          startsAt: { lt: endsAt },
          endsAt: { gt: input.startsAt },
        },
      });
      if (overlap > 0) {
        throw new Error("DOUBLE_BOOK");
      }

      const blockOverlap = await tx.blockedSlot.count({
        where: {
          tenantId: input.tenantId,
          startsAt: { lt: endsAt },
          endsAt: { gt: input.startsAt },
          OR: [{ staffId: null }, { staffId: input.staffId }],
        },
      });
      if (blockOverlap > 0) {
        throw new Error("BLOCKED");
      }

      await tx.booking.update({
        where: { id: input.bookingId },
        data: {
          serviceId: input.serviceId,
          staffId: input.staffId,
          ...buildBookingFinancialSnapshots({
            servicePriceCents: service.priceCents,
            commissionPercent: staff.commissionPercent,
          }),
          startsAt: input.startsAt,
          endsAt,
        },
      });

      await tx.reminderJob.updateMany({
        where: { bookingId: input.bookingId, sentAt: null },
        data: { fireAt: addMinutes(input.startsAt, -24 * 60) },
      });
    });

    return { ok: true as const };
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "DOUBLE_BOOK") {
        return { ok: false as const, code: "DOUBLE_BOOK" as const };
      }
      if (e.message === "BLOCKED") {
        return { ok: false as const, code: "BLOCKED" as const };
      }
    }
    throw e;
  }
}
