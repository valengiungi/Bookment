import { addDays, addMonths } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { redirect } from "next/navigation";
import { auth } from "@/auth";import { withDbRetry } from "@/lib/db-retry";
import { prisma } from "@/lib/prisma";
import { formatCalendarMonthTitle } from "@/lib/calendar-display";
import { defaultTimeZone } from "@/lib/timezone";
import { DashboardHomeLive } from "./dashboard-home-live";

function clampYmdToMonth(ymd: string, monthStart: Date, tz: string) {
  const day = Number(ymd.slice(8, 10));
  const y = Number(formatInTimeZone(monthStart, tz, "yyyy"));
  const mo = Number(formatInTimeZone(monthStart, tz, "MM"));
  const lastOfMonth = addDays(addMonths(monthStart, 1), -1);
  const maxD = Number(formatInTimeZone(lastOfMonth, tz, "d"));
  const d = Math.min(Math.max(day, 1), maxD);
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default async function DashboardHomePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) {
    redirect("/login");
  }
  const tz = defaultTimeZone;

  const todayYmd = formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
  const dateYmd =
    sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayYmd;

  let monthKey =
    sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : dateYmd.slice(0, 7);

  if (dateYmd.slice(0, 7) !== monthKey) {
    monthKey = dateYmd.slice(0, 7);
  }

  const rangeStart = toDate(`${monthKey}-01T00:00:00`, { timeZone: tz });
  const rangeEnd = addMonths(rangeStart, 1);
  const nextMonthStart = addMonths(rangeStart, 1);
  const daysInMonth = Number(formatInTimeZone(addDays(nextMonthStart, -1), tz, "d"));

  const prevStart = addMonths(rangeStart, -1);
  const nextStart = addMonths(rangeStart, 1);
  const prevKey = formatInTimeZone(prevStart, tz, "yyyy-MM");
  const nextKey = formatInTimeZone(nextStart, tz, "yyyy-MM");
  const prevDate = clampYmdToMonth(dateYmd, prevStart, tz);
  const nextDate = clampYmdToMonth(dateYmd, nextStart, tz);
  const prevHref = `/dashboard?month=${prevKey}&date=${prevDate}`;
  const nextHref = `/dashboard?month=${nextKey}&date=${nextDate}`;

  const monthTitle = formatCalendarMonthTitle(monthKey, tz);

  const dayStart = toDate(`${dateYmd}T00:00:00`, { timeZone: tz });
  const dayEnd = addDays(dayStart, 1);

  const todayWindowStart = toDate(`${todayYmd}T00:00:00`, { timeZone: tz });
  const todayWindowEnd = addDays(todayWindowStart, 1);

  const [
    todayCount,
    upcoming,
    staffCount,
    serviceCount,
    monthBookingRows,
    dayBookings,
  ] = await withDbRetry(() =>
    Promise.all([
      prisma.booking.count({
        where: {
          tenantId,
          status: "CONFIRMED",
          startsAt: { gte: todayWindowStart, lt: todayWindowEnd },
        },
      }),
      prisma.booking.count({
        where: {
          tenantId,
          status: "CONFIRMED",
          startsAt: { gte: new Date() },
        },
      }),
      prisma.staff.count({ where: { tenantId, active: true } }),
      prisma.service.count({ where: { tenantId, active: true } }),
      prisma.booking.findMany({
        where: {
          tenantId,
          status: "CONFIRMED",
          startsAt: { gte: rangeStart, lt: rangeEnd },
        },
        select: { startsAt: true },
      }),
      prisma.booking.findMany({
        where: {
          tenantId,
          status: "CONFIRMED",
          startsAt: { gte: dayStart, lt: dayEnd },
        },
        include: { service: true, staff: true },
        orderBy: { startsAt: "asc" },
      }),
    ]),
  );
  const counts: Record<string, number> = {};
  for (const b of monthBookingRows) {
    const k = formatInTimeZone(b.startsAt, tz, "yyyy-MM-dd");
    counts[k] = (counts[k] ?? 0) + 1;
  }

  const initialDayBookings = dayBookings.map((b) => ({
    id: b.id,
    startsAt: b.startsAt.toISOString(),
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    service: { name: b.service.name },
    staff: { name: b.staff.name },
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Resumen</h1>
        <p className="mt-1 text-sm text-slate-600 capitalize">
          {new Date().toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      <DashboardHomeLive
        key={`${monthKey}-${dateYmd}`}
        timeZone={tz}
        monthKey={monthKey}
        dateYmd={dateYmd}
        todayYmd={todayYmd}
        daysInMonth={daysInMonth}
        prevHref={prevHref}
        nextHref={nextHref}
        monthTitle={monthTitle}
        initialCounts={counts}
        initialDayBookings={initialDayBookings}
        initialTodayCount={todayCount}
        initialUpcoming={upcoming}
        initialStaffCount={staffCount}
        initialServiceCount={serviceCount}
      />
    </div>
  );
}
