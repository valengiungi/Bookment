import { addMonths, addYears } from "date-fns";

export const BILLING_CYCLE_VALUES = ["MONTHLY", "ANNUAL"] as const;
export type BillingCycleValue = (typeof BILLING_CYCLE_VALUES)[number];

export function isBillingCycleValue(value: string): value is BillingCycleValue {
  return (BILLING_CYCLE_VALUES as readonly string[]).includes(value);
}

export function billingCycleLabel(value: BillingCycleValue): string {
  return value === "ANNUAL" ? "Anual" : "Mensual";
}

export function nextDueFromPaidAt(date: Date, cycle: BillingCycleValue): Date {
  return cycle === "ANNUAL" ? addYears(date, 1) : addMonths(date, 1);
}

/**
 * Guardamos la fecha al mediodía UTC para no correr el día al formatear
 * entre zonas horarias cercanas a AR.
 */
export function parseAdminDateInput(value: string): Date | null {
  const raw = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

export function formatAdminDate(date: Date): string {
  return date.toLocaleDateString("es-AR", { dateStyle: "short" });
}

export type BillingStatus = "up_to_date" | "due_today" | "overdue";

export function billingStatusFromNextDueAt(nextDueAt: Date, now = new Date()): BillingStatus {
  const todayKey = now.toISOString().slice(0, 10);
  const dueKey = nextDueAt.toISOString().slice(0, 10);
  if (dueKey === todayKey) return "due_today";
  return dueKey < todayKey ? "overdue" : "up_to_date";
}

export function billingStatusLabel(status: BillingStatus): string {
  if (status === "due_today") return "Vence hoy";
  if (status === "overdue") return "Vencido";
  return "Al día";
}
