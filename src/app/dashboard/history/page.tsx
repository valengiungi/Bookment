import { addMonths } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { auth } from "@/auth";
import { HistorySummaryTabs } from "@/app/dashboard/history/history-summary-tabs";
import { prisma } from "@/lib/prisma";
import { defaultTimeZone } from "@/lib/timezone";

async function revenueCentsFor(args: {
  tenantId: string;
  startsAtGte?: Date;
  startsAtLt?: Date;
}) {
  const grouped = await prisma.booking.groupBy({
    by: ["serviceId"],
    where: {
      tenantId: args.tenantId,
      status: "CONFIRMED",
      startsAt: {
        gte: args.startsAtGte,
        lt: args.startsAtLt,
      },
    },
    _count: { _all: true },
  });

  if (!grouped.length) return 0;

  const services = await prisma.service.findMany({
    where: {
      id: { in: grouped.map((g) => g.serviceId) },
    },
    select: { id: true, priceCents: true },
  });
  const priceByService = new Map(services.map((s) => [s.id, s.priceCents ?? 0]));

  return grouped.reduce((acc, g) => {
    const price = priceByService.get(g.serviceId) ?? 0;
    return acc + price * g._count._all;
  }, 0);
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
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
      <h1 className="text-xl font-semibold text-slate-900">Historial</h1>

      <HistorySummaryTabs
        monthLabel={formatInTimeZone(monthStart, tz, "MMMM yyyy")}
        monthCuts={monthCuts}
        monthRevenue={ars(monthRevenueCents)}
        monthTop={monthTopUi}
        totalCuts={totalCuts}
        totalRevenue={ars(totalRevenueCents)}
        totalTop={totalTopUi}
        prevMonthHref={`/dashboard/history?month=${prevMonth}`}
        nextMonthHref={`/dashboard/history?month=${nextMonth}`}
        canGoNextMonth={canGoNextMonth}
      />
    </div>
  );
}
