import { formatInTimeZone } from "date-fns-tz";

/** 00:00 … 23:45 en pasos de 15 min (mismo criterio que horarios del negocio). */
export const BLOCK_QUARTER_HOURS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

/** Si la hora exacta no cae en cuarto horario, se agrega como opción. */
export function blockTimeSelectOptions(isoInstant: Date, timeZone: string): string[] {
  const t = formatInTimeZone(isoInstant, timeZone, "HH:mm");
  if (BLOCK_QUARTER_HOURS.includes(t)) return [...BLOCK_QUARTER_HOURS];
  return [t, ...BLOCK_QUARTER_HOURS].filter((v, i, a) => a.indexOf(v) === i).sort();
}
