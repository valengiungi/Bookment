import { es } from "date-fns/locale/es";
import { formatInTimeZone, toDate } from "date-fns-tz";

/** Título del mes alineado con la zona del negocio (evita Intl + UTC medianoche = mes anterior). */
export function formatCalendarMonthTitle(monthKey: string, timeZone: string): string {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return monthKey;
  const anchor = toDate(`${monthKey}-01T12:00:00`, { timeZone });
  return formatInTimeZone(anchor, timeZone, "MMMM yyyy", { locale: es });
}

/** Encabezado para un día calendario yyyy-MM-dd en la zona del negocio. */
export function formatCalendarDayHeading(dateYmd: string, timeZone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) return dateYmd;
  const anchor = toDate(`${dateYmd}T12:00:00`, { timeZone });
  return formatInTimeZone(anchor, timeZone, "EEEE d 'de' MMMM yyyy", { locale: es });
}

export function formatInstantDayHeading(isoOrDate: string | Date, timeZone: string): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return formatInTimeZone(d, timeZone, "EEEE d 'de' MMMM yyyy", { locale: es });
}
