import { addDays, addMonths } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDashboardActor, getEmployeeStaffId, isEmployeeRole } from "@/lib/dashboard-actor";
import { prisma } from "@/lib/prisma";
import { defaultTimeZone } from "@/lib/timezone";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const actor = await getDashboardActor(session.user.id, tenantId);
  if (!actor) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const employeeStaffId = getEmployeeStaffId(actor);
  if (isEmployeeRole(actor.role) && !employeeStaffId) {
    return NextResponse.json({ error: "Perfil no disponible" }, { status: 403 });
  }
  const tz = defaultTimeZone;

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");
  const dateParam = searchParams.get("date");

  const todayYmd = formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
  const dateYmd =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayYmd;

  let monthKey =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : dateYmd.slice(0, 7);

  if (dateYmd.slice(0, 7) !== monthKey) {
    monthKey = dateYmd.slice(0, 7);
  }

  const rangeStart = toDate(`${monthKey}-01T00:00:00`, { timeZone: tz });
  const rangeEnd = addMonths(rangeStart, 1);
  const dayStart = toDate(`${dateYmd}T00:00:00`, { timeZone: tz });
  const dayEnd = addDays(dayStart, 1);

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [todayCount, upcoming, staffCount, serviceCount, monthRows, dayBookings] =
    await Promise.all([
      prisma.booking.count({
        where: {
          tenantId,
          ...(employeeStaffId ? { staffId: employeeStaffId } : {}),
          status: "CONFIRMED",
          startsAt: { gte: start, lt: end },
        },
      }),
      prisma.booking.count({
        where: {
          tenantId,
          ...(employeeStaffId ? { staffId: employeeStaffId } : {}),
          status: "CONFIRMED",
          startsAt: { gte: new Date() },
        },
      }),
      employeeStaffId
        ? prisma.staff.count({ where: { id: employeeStaffId, tenantId, active: true } })
        : prisma.staff.count({ where: { tenantId, active: true } }),
      employeeStaffId
        ? prisma.service.count({
            where: {
              tenantId,
              active: true,
              OR: [
                { bookings: { some: { staffId: employeeStaffId } } },
                { staffAssignments: { some: { staffId: employeeStaffId } } },
              ],
            },
          })
        : prisma.service.count({ where: { tenantId, active: true } }),
      prisma.booking.findMany({
        where: {
          tenantId,
          ...(employeeStaffId ? { staffId: employeeStaffId } : {}),
          status: "CONFIRMED",
          startsAt: { gte: rangeStart, lt: rangeEnd },
        },
        select: { startsAt: true },
      }),
      prisma.booking.findMany({
        where: {
          tenantId,
          ...(employeeStaffId ? { staffId: employeeStaffId } : {}),
          status: "CONFIRMED",
          startsAt: { gte: dayStart, lt: dayEnd },
        },
        include: { service: true, staff: true },
        orderBy: { startsAt: "asc" },
      }),
    ]);

  const counts: Record<string, number> = {};
  for (const b of monthRows) {
    const k = formatInTimeZone(b.startsAt, tz, "yyyy-MM-dd");
    counts[k] = (counts[k] ?? 0) + 1;
  }

  return NextResponse.json({
    todayYmd,
    monthKey,
    dateYmd,
    counts,
    dayBookings: dayBookings.map((b) => ({
      id: b.id,
      startsAt: b.startsAt.toISOString(),
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      service: { name: b.service.name },
      staff: { name: b.staff.name },
    })),
    todayCount,
    upcoming,
    staffCount,
    serviceCount,
  });
}
