import Link from "next/link";
import { jsDayOfWeekForYmd } from "@/modules/calendar/slots";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function DashboardHomeCalendar({
  timeZone,
  monthKey,
  selectedYmd,
  todayYmd,
  counts,
  daysInMonth,
  prevHref,
  nextHref,
  monthTitle,
}: {
  timeZone: string;
  monthKey: string;
  selectedYmd: string;
  todayYmd: string;
  counts: Record<string, number>;
  daysInMonth: number;
  prevHref: string;
  nextHref: string;
  monthTitle: string;
}) {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const firstYmd = `${y}-${String(m).padStart(2, "0")}-01`;
  const pad = (jsDayOfWeekForYmd(firstYmd, timeZone) + 6) % 7;

  const padCells = Array.from({ length: pad }, (_, i) => (
    <div key={`p-${i}`} className="aspect-square" aria-hidden />
  ));

  const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const n = counts[ymd] ?? 0;
    const isSel = ymd === selectedYmd;
    const isToday = ymd === todayYmd;
    const isPast = ymd < todayYmd;

    return (
      <Link
        key={ymd}
        href={`/dashboard?month=${monthKey}&date=${ymd}`}
        className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm font-semibold transition hover:opacity-95 ${
          isSel
            ? "bg-teal-600 text-white shadow-md ring-2 ring-teal-600 ring-offset-2"
            : isPast
              ? "bg-slate-100 text-slate-500 ring-1 ring-slate-200/80"
              : "bg-white text-slate-800 ring-1 ring-slate-200/80 hover:bg-slate-50"
        } py-1 ${isToday && !isSel ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}
      >
        <span>{d}</span>
        {n > 0 ? (
          <span
            className={`text-[0.65rem] font-semibold leading-none tabular-nums ${
              isSel ? "text-teal-100" : "text-teal-700"
            }`}
          >
            {n}
          </span>
        ) : null}
      </Link>
    );
  });

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link
          href={prevHref}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          aria-label="Mes anterior"
        >
          ‹
        </Link>
        <p className="text-center text-sm font-semibold capitalize text-slate-900">{monthTitle}</p>
        <Link
          href={nextHref}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          aria-label="Mes siguiente"
        >
          ›
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1.5">
        {padCells}
        {dayCells}
      </div>
      <p className="mt-3 text-xs text-slate-500">Tocá un día para ver los turnos a la derecha.</p>
    </div>
  );
}
