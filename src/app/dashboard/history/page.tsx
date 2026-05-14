import { addMonths } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { auth } from "@/auth";
import { HistorySummaryTabs } from "@/app/dashboard/history/history-summary-tabs";
import { HistoryExportPanel } from "@/app/dashboard/history/history-export-panel";
import { canExportData, canViewRevenueInsights } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { resolveBookingServicePriceCents } from "@/lib/staff-commissions";
import { defaultTimeZone } from "@/lib/timezone";

async function revenueCentsFor(args: {
  tenantId: string;
  startsAtGte?: Date;
  startsAtLt?: Date;
}) {
  const bookings = await prisma.booking.findMany({
    where: {
      tenantId: args.tenantId,
      status: "CONFIRMED",
      startsAt: {
        gte: args.startsAtGte,
        lt: args.startsAtLt,
      },
    },
    select: {
      servicePriceCentsSnapshot: true,
      service: {
        select: { priceCents: true },
      },
    },
  });

  return bookings.reduce((acc, booking) => acc + resolveBookingServicePriceCents(booking), 0);
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { subscriptionTier: true },
  });
  const subscriptionTier = tenant?.subscriptionTier ?? "simple";
  const insightsLocked = !canViewRevenueInsights(subscriptionTier);
  const exportOk = canExportData(subscriptionTier);
  const tz = defaultTimeZone;
  const now = new Date();
  const currentMonthStr = formatInTimeZone(now, tz, "yyyy-MM");
  const { month } = await searchParams;
  const monthStr =
    month && /^\d{4}-\d{2}$/.test(month) && month <= currentMonthStr
      ? month
      : currentMonthStr;

  const monthStart = toDate(`${monthStr}-01T00:00:00`, { timeZone: tz });
  const monthEnd = addMonths(monthStart, 1);

  const [monthCuts, monthRevenueCents, monthTop, totalCuts, totalRevenueCents, totalTop] =
    await Promise.all([
      prisma.booking.count({
        where: {
          tenantId,
          status: "CONFIRMED",
          startsAt: { gte: monthStart, lt: monthEnd },
        },
      }),
      revenueCentsFor({ tenantId, startsAtGte: monthStart, startsAtLt: monthEnd }),
      prisma.booking.groupBy({
        by: ["customerName", "customerPhone"],
        where: {
          tenantId,
          status: "CONFIRMED",
          startsAt: { gte: monthStart, lt: monthEnd },
        },
        _count: { _all: true },
        orderBy: { _count: { customerPhone: "desc" } },
        take: 5,
      }),
      prisma.booking.count({
        where: { tenantId, status: "CONFIRMED" },
      }),
      revenueCentsFor({ tenantId }),
      prisma.booking.groupBy({
        by: ["customerName", "customerPhone"],
        where: { tenantId, status: "CONFIRMED" },
        _count: { _all: true },
        orderBy: { _count: { customerPhone: "desc" } },
        take: 5,
      }),
    ]);

  const ars = (cents: number) => `$${(cents / 100).toLocaleString("es-AR")}`;
  const avgStr = (cents: number, cuts: number) =>
    insightsLocked || cuts <= 0 ? "—" : ars(Math.round(cents / cuts));

  const prevMonth = formatInTimeZone(addMonths(monthStart, -1), tz, "yyyy-MM");
  const nextMonth = formatInTimeZone(addMonths(monthStart, 1), tz, "yyyy-MM");
  const canGoNextMonth = monthStr < currentMonthStr;

  const monthTopUi = monthTop.map((c) => ({
    customerName: c.customerName,
    customerPhone: c.customerPhone,
    count: c._count._all,
  }));
  const totalTopUi = totalTop.map((c) => ({
    customerName: c.customerName,
    customerPhone: c.customerPhone,
    count: c._count._all,
  }));

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <h1 className="text-xl font-semibold text-slate-900">Historial</h1>
        <HistoryExportPanel enabled={exportOk} />
      </div>

      <HistorySummaryTabs
        monthLabel={formatInTimeZone(monthStart, tz, "MMMM yyyy")}
        monthCuts={monthCuts}
        monthRevenue={insightsLocked ? "—" : ars(monthRevenueCents)}
        monthAvgRevenue={avgStr(monthRevenueCents, monthCuts)}
        monthTop={monthTopUi}
        totalCuts={totalCuts}
        totalRevenue={insightsLocked ? "—" : ars(totalRevenueCents)}
        totalAvgRevenue={avgStr(totalRevenueCents, totalCuts)}
        totalTop={totalTopUi}
        prevMonthHref={`/dashboard/history?month=${prevMonth}`}
        nextMonthHref={`/dashboard/history?month=${nextMonth}`}
        canGoNextMonth={canGoNextMonth}
        insightsLocked={insightsLocked}
      />
    </div>
  );
}
