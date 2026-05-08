import { fromZonedTime } from "date-fns-tz";

/**
 * Interpreta el valor de un input datetime-local como horario de pared en `timeZone`
 * y devuelve el instante UTC equivalente (para guardar en BD).
 */
export function parseDatetimeLocalToUtc(value: unknown, timeZone: string): Date | null {
  const raw = String(value ?? "").trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(raw);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const sec = m[6] != null ? Number(m[6]) : 0;
  if (
    [y, mo, d, h, mi, sec].some((n) => !Number.isFinite(n)) ||
    mo < 1 ||
    mo > 12 ||
    d < 1 ||
    d > 31 ||
    h > 23 ||
    mi > 59 ||
    sec > 59
  ) {
    return null;
  }

  const wallAsUtcFields = new Date(Date.UTC(y, mo - 1, d, h, mi, sec, 0));
  const utc = fromZonedTime(wallAsUtcFields, timeZone);
  return Number.isNaN(utc.getTime()) ? null : utc;
}
