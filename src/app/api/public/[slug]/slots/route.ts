import { addDays } from "date-fns";
import { NextResponse } from "next/server";
import { toDate } from "date-fns-tz";
import { BookingStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { defaultTimeZone } from "@/lib/timezone";
import { canAcceptAnotherBooking } from "@/lib/plan-limits";
import { staffOffersService } from "@/lib/staff-services";
import { buildSlotStarts, formatSlotLabel } from "@/modules/calendar/slots";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  if (isReservedSlug(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");
  const staffId = searchParams.get("staffId");
  const dateYmd = searchParams.get("date");

  if (!serviceId || !staffId || !dateYmd || !/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug, active: true },
    select: { id: true, subscriptionTier: true, sameServicesAllStaff: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  }

  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId: tenant.id, active: true },
  });
  if (!service) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId: tenant.id, active: true },
  });
  if (!staff) {
    return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
  }

  const comboOk = await staffOffersService(
    prisma,
    tenant.id,
    tenant.sameServicesAllStaff,
    staffId,
    serviceId,
  );
  if (!comboOk) {
    return NextResponse.json(
      { error: "Este profesional no ofrece ese servicio" },
      { status: 400 },
    );
  }

  const tz = defaultTimeZone;

  const quotaOk = await canAcceptAnotherBooking(tenant.id, tenant.subscriptionTier, tz);
  if (!quotaOk) {
    return NextResponse.json({ slots: [], monthlyQuotaBlocked: true });
  }

  const dayStart = toDate(`${dateYmd}T00:00:00`, { timeZone: tz });
  const dayEnd = addDays(dayStart, 1);

  const [workingHours, bookings, blocks] = await Promise.all([
    prisma.workingHour.findMany({
      where: { tenantId: tenant.id, OR: [{ staffId: null }, { staffId }] },
    }),
    prisma.booking.findMany({
      where: {
        staffId,
        status: BookingStatus.CONFIRMED,
        startsAt: { gte: dayStart, lt: dayEnd },
      },
    }),
    prisma.blockedSlot.findMany({
      where: {
        tenantId: tenant.id,
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
        OR: [{ staffId: null }, { staffId }],
      },
    }),
  ]);

  const busy = [
    ...bookings.map((b) => ({ startsAt: b.startsAt, endsAt: b.endsAt })),
    ...blocks.map((b) => ({ startsAt: b.startsAt, endsAt: b.endsAt })),
  ];

  const slots = buildSlotStarts({
    dateYmd,
    durationMinutes: service.durationMinutes,
    workingHours,
    staffId,
    busy,
    timeZone: tz,
  });

  return NextResponse.json({
    slots: slots.map((s) => ({
      startsAt: s.toISOString(),
      label: formatSlotLabel(s, tz),
    })),
  });
}
