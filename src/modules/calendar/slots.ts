import { addMinutes } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import type { WorkingHour } from "@/generated/prisma";
import { defaultTimeZone } from "@/lib/timezone";

/** Minutos después del servicio para higiene y orden del puesto; el bloque en agenda incluye este tiempo. */
export const POST_SERVICE_BUFFER_MINUTES = 5;

/** ISO weekday 1=Mon … 7=Sun → JS getDay() 0=Sun … 6=Sat */
function isoWeekdayToJs(iso: number) {
  return iso === 7 ? 0 : iso;
}

export function jsDayOfWeekForYmd(dateYmd: string, timeZone: string) {
  const iso = Number.parseInt(
    formatInTimeZone(new Date(`${dateYmd}T12:00:00.000Z`), timeZone, "i"),
    10,
  );
  return isoWeekdayToJs(iso);
}

function parseHm(hm: string) {
  const [h, m] = hm.split(":").map((x) => Number.parseInt(x, 10));
  return { h, m };
}

function minutesSinceMidnight(hm: string) {
  const { h, m } = parseHm(hm);
  return h * 60 + m;
}

function resolveHoursForDay(
  all: WorkingHour[],
  staffId: string,
  dayOfWeek: number,
): { opensAt: string; closesAt: string } | null {
  const forStaff = all.filter((w) => w.staffId === staffId && w.dayOfWeek === dayOfWeek);
  if (forStaff.length) {
    return { opensAt: forStaff[0].opensAt, closesAt: forStaff[0].closesAt };
  }
  const fallback = all.find((w) => w.staffId === null && w.dayOfWeek === dayOfWeek);
  if (!fallback) return null;
  return { opensAt: fallback.opensAt, closesAt: fallback.closesAt };
}

/** Ventana horaria del profesional para una fecha (yyyy-MM-dd) en la zona del negocio. */
export function getStaffDayWindow(
  workingHours: WorkingHour[],
  staffId: string,
  dateYmd: string,
  timeZone: string,
): { opensAt: string; closesAt: string } | null {
  const dow = jsDayOfWeekForYmd(dateYmd, timeZone);
  return resolveHoursForDay(workingHours, staffId, dow);
}

export type BusyRange = { startsAt: Date; endsAt: Date };

export function buildSlotStarts(args: {
  dateYmd: string;
  durationMinutes: number;
  workingHours: WorkingHour[];
  staffId: string;
  busy: BusyRange[];
  timeZone?: string;
  now?: Date;
}) {
  const tz = args.timeZone ?? defaultTimeZone;
  const now = args.now ?? new Date();
  const dow = jsDayOfWeekForYmd(args.dateYmd, tz);
  const window = resolveHoursForDay(args.workingHours, args.staffId, dow);
  if (!window) return [];

  const openM = minutesSinceMidnight(window.opensAt);
  const closeM = minutesSinceMidnight(window.closesAt);
  if (closeM <= openM) return [];

  const duration = Math.max(1, args.durationMinutes);
  const blockMinutes = duration + POST_SERVICE_BUFFER_MINUTES;
  const slotStep = blockMinutes;

  const slots: Date[] = [];
  for (let m = openM; m + blockMinutes <= closeM; m += slotStep) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    const label = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    const startsAt = toDate(`${args.dateYmd}T${label}:00`, { timeZone: tz });
    const blockEnd = addMinutes(startsAt, blockMinutes);
    if (startsAt < now) continue;

    const blocked = args.busy.some(
      (b) => startsAt < b.endsAt && blockEnd > b.startsAt,
    );
    if (!blocked) slots.push(startsAt);
  }
  return slots;
}

export function formatSlotLabel(date: Date, timeZone: string) {
  return formatInTimeZone(date, timeZone, "HH:mm");
}
