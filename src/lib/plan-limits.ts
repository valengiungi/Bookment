import { addMonths } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { defaultTimeZone } from "@/lib/timezone";
import { planDefinitionForTenant } from "@/lib/plans";

export async function serviceCountForTenant(tenantId: string): Promise<number> {
  return prisma.service.count({ where: { tenantId } });
}

export async function staffCountForTenant(tenantId: string): Promise<number> {
  return prisma.staff.count({ where: { tenantId } });
}

export async function canCreateService(tenantId: string, storedTier: string): Promise<boolean> {
  const def = planDefinitionForTenant(storedTier);
  if (def.maxServices === null) return true;
  const n = await serviceCountForTenant(tenantId);
  return n < def.maxServices;
}

export async function canCreateStaff(tenantId: string, storedTier: string): Promise<boolean> {
  const def = planDefinitionForTenant(storedTier);
  if (def.maxStaff === null) return true;
  const n = await staffCountForTenant(tenantId);
  return n < def.maxStaff;
}

/** Turnos confirmados en el mes calendario vigente (fecha de inicio del turno, TZ del negocio). */
export async function confirmedStartsThisMonthCount(
  tenantId: string,
  tz: string = defaultTimeZone,
): Promise<number> {
  const now = new Date();
  const monthStr = formatInTimeZone(now, tz, "yyyy-MM");
  const monthStart = toDate(`${monthStr}-01T00:00:00`, { timeZone: tz });
  const monthEnd = addMonths(monthStart, 1);

  return prisma.booking.count({
    where: {
      tenantId,
      status: "CONFIRMED",
      startsAt: { gte: monthStart, lt: monthEnd },
    },
  });
}

export async function canAcceptAnotherBooking(
  tenantId: string,
  storedTier: string,
  tz: string = defaultTimeZone,
): Promise<boolean> {
  const def = planDefinitionForTenant(storedTier);
  if (def.maxMonthlyBookings === null) return true;
  const n = await confirmedStartsThisMonthCount(tenantId, tz);
  return n < def.maxMonthlyBookings;
}

export function canExportData(storedTier: string): boolean {
  return planDefinitionForTenant(storedTier).allowDataExport;
}

export function canViewRevenueInsights(storedTier: string): boolean {
  return planDefinitionForTenant(storedTier).allowRevenueInsights;
}
