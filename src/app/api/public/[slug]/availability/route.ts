import { addDays, addMonths } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { NextResponse } from "next/server";
import { BookingStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { confirmedStartsThisMonthCount } from "@/lib/plan-limits";
import { planDefinitionForTenant } from "@/lib/plans";
import { defaultTimeZone } from "@/lib/timezone";
import { buildSlotStarts, getStaffDayWindow, jsDayOfWeekForYmd } from "@/modules/calendar/slots";

/** `monthly_cap`: cupo mensual de reservas web agotado (plan Simple). */
export type PublicDayStatus = "past" | "closed" | "full" | "open" | "monthly_cap";

function busyForStaffDay(
  staffId: string,
  dayStart: Date,
  dayEnd: Date,
  bookings: { staffId: string; startsAt: Date; endsAt: Date }[],
  blocks: { staffId: string | null; startsAt: Date; endsAt: Date }[],
) {
  const busy: { startsAt: Date; endsAt: Date }[] = [];
  for (const b of bookings) {
    if (b.staffId !== staffId) continue;
    if (b.startsAt < dayEnd && b.endsAt > dayStart) {
      busy.push({ startsAt: b.startsAt, endsAt: b.endsAt });
    }
  }
  for (const b of blocks) {
    if (b.staffId != null && b.staffId !== staffId) continue;
    if (b.startsAt < dayEnd && b.endsAt > dayStart) {
      busy.push({ startsAt: b.startsAt, endsAt: b.endsAt });
    }
  }
  return busy;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  if (isReservedSlug(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const monthRaw = searchParams.get("month");
  if (!monthRaw || !/^\d{4}-\d{2}$/.test(monthRaw)) {
    return NextResponse.json({ error: "month inválido (usar yyyy-MM)" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug, active: true },
    include: {
      services: { where: { active: true }, select: { id: true, durationMinutes: true } },
      staff: { where: { active: true }, select: { id: true } },
    },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  }

  const staffServicePairs = new Set<string>();
  if (!tenant.sameServicesAllStaff && tenant.staff.length && tenant.services.length) {
    const links = await prisma.staffService.findMany({
      where: {
        staffId: { in: tenant.staff.map((s) => s.id) },
        serviceId: { in: tenant.services.map((s) => s.id) },
      },
      select: { staffId: true, serviceId: true },
    });
    for (const l of links) {
      staffServicePairs.add(`${l.staffId}:${l.serviceId}`);
    }
  }
  const staffOffers = (staffId: string, serviceId: string) =>
    tenant.sameServicesAllStaff || staffServicePairs.has(`${staffId}:${serviceId}`);

  if (!tenant.services.length || !tenant.staff.length) {
    return NextResponse.json({
      month: monthRaw,
      timeZone: defaultTimeZone,
      todayYmd: formatInTimeZone(new Date(), defaultTimeZone, "yyyy-MM-dd"),
      monthlyQuotaBlocked: false,
      days: {},
    });
  }

  const tz = defaultTimeZone;
  const now = new Date();
  const todayYmd = formatInTimeZone(now, tz, "yyyy-MM-dd");

  const plan = planDefinitionForTenant(tenant.subscriptionTier);
  let monthlyQuotaBlocked = false;
  if (plan.maxMonthlyBookings != null) {
    const used = await confirmedStartsThisMonthCount(tenant.id, tz);
    monthlyQuotaBlocked = used >= plan.maxMonthlyBookings;
  }
  const [yStr, mStr] = monthRaw.split("-");
  const year = Number(yStr);
  const mm = mStr;

  const rangeStart = toDate(`${year}-${mm}-01T00:00:00`, { timeZone: tz });
  const nextMonthStart = addMonths(rangeStart, 1);

  const staffIds = tenant.staff.map((s) => s.id);

  const [workingHours, bookings, blocks] = await Promise.all([
    prisma.workingHour.findMany({ where: { tenantId: tenant.id } }),
    prisma.booking.findMany({
      where: {
        tenantId: tenant.id,
        staffId: { in: staffIds },
        status: BookingStatus.CONFIRMED,
        startsAt: { gte: rangeStart, lt: nextMonthStart },
      },
      select: { staffId: true, startsAt: true, endsAt: true },
    }),
    prisma.blockedSlot.findMany({
      where: {
        tenantId: tenant.id,
        startsAt: { lt: nextMonthStart },
        endsAt: { gt: rangeStart },
        OR: [{ staffId: null }, { staffId: { in: staffIds } }],
      },
      select: { staffId: true, startsAt: true, endsAt: true },
    }),
  ]);

  const days: Record<string, PublicDayStatus> = {};
  let cursor = rangeStart;

  while (cursor < nextMonthStart) {
    const dateYmd = formatInTimeZone(cursor, tz, "yyyy-MM-dd");

    if (dateYmd < todayYmd) {
      days[dateYmd] = "past";
      cursor = addDays(cursor, 1);
      continue;
    }

    let anyStaffWorks = false;
    let anySlot = false;

    for (const st of tenant.staff) {
      const win = getStaffDayWindow(workingHours, st.id, dateYmd, tz);
      if (!win) continue;
      anyStaffWorks = true;

      const dayStart = toDate(`${dateYmd}T00:00:00`, { timeZone: tz });
      const dayEnd = addDays(dayStart, 1);
      const busy = busyForStaffDay(st.id, dayStart, dayEnd, bookings, blocks);

      for (const svc of tenant.services) {
        if (!staffOffers(st.id, svc.id)) continue;
        const slots = buildSlotStarts({
          dateYmd,
          durationMinutes: svc.durationMinutes,
          workingHours,
          staffId: st.id,
          busy,
          timeZone: tz,
          now,
        });
        if (slots.length > 0) {
          anySlot = true;
          break;
        }
      }
      if (anySlot) break;
    }

    if (!anyStaffWorks) {
      days[dateYmd] = "closed";
    } else if (anySlot) {
      days[dateYmd] =
        monthlyQuotaBlocked && dateYmd >= todayYmd ? "monthly_cap" : "open";
    } else {
      days[dateYmd] = "full";
    }

    cursor = addDays(cursor, 1);
  }

  return NextResponse.json({
    month: monthRaw,
    timeZone: tz,
    todayYmd,
    monthlyQuotaBlocked,
    firstWeekdayMon0: (jsDayOfWeekForYmd(`${year}-${mm}-01`, tz) + 6) % 7,
    daysInMonth: Number(formatInTimeZone(addDays(nextMonthStart, -1), tz, "d")),
    days,
  });
}
