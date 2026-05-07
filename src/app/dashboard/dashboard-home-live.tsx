"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCalendarDayHeading } from "@/lib/calendar-display";
import { CancelBookingButton } from "./cancel-booking-button";
import { DashboardHomeCalendar } from "./dashboard-home-calendar";

export type InicioLiveBooking = {
  id: string;
  startsAt: string;
  customerName: string;
  customerPhone: string;
  service: { name: string };
  staff: { name: string };
};

type LivePayload = {
  todayYmd: string;
  counts: Record<string, number>;
  dayBookings: InicioLiveBooking[];
  todayCount: number;
  upcoming: number;
  staffCount: number;
  serviceCount: number;
};

const POLL_MS = 12_000;

export function DashboardHomeLive({
  timeZone,
  monthKey,
  dateYmd,
  todayYmd: todayYmdInitial,
  daysInMonth,
  prevHref,
  nextHref,
  monthTitle,
  initialCounts,
  initialDayBookings,
  initialTodayCount,
  initialUpcoming,
  initialStaffCount,
  initialServiceCount,
}: {
  timeZone: string;
  monthKey: string;
  dateYmd: string;
  todayYmd: string;
  daysInMonth: number;
  prevHref: string;
  nextHref: string;
  monthTitle: string;
  initialCounts: Record<string, number>;
  initialDayBookings: InicioLiveBooking[];
  initialTodayCount: number;
  initialUpcoming: number;
  initialStaffCount: number;
  initialServiceCount: number;
}) {
  const [todayYmd, setTodayYmd] = useState(todayYmdInitial);
  const [counts, setCounts] = useState(initialCounts);
  const [dayBookings, setDayBookings] = useState(initialDayBookings);
  const [todayCount, setTodayCount] = useState(initialTodayCount);
  const [upcoming, setUpcoming] = useState(initialUpcoming);
  const [staffCount, setStaffCount] = useState(initialStaffCount);
  const [serviceCount, setServiceCount] = useState(initialServiceCount);

  const dayHeading = useMemo(
    () => formatCalendarDayHeading(dateYmd, timeZone),
    [dateYmd, timeZone],
  );

  const fetchLive = useCallback(async () => {
    const url = `/api/dashboard/inicio-live?month=${encodeURIComponent(monthKey)}&date=${encodeURIComponent(dateYmd)}`;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as LivePayload;
      setTodayYmd(data.todayYmd);
      setCounts(data.counts);
      setDayBookings(data.dayBookings);
      setTodayCount(data.todayCount);
      setUpcoming(data.upcoming);
      setStaffCount(data.staffCount);
      setServiceCount(data.serviceCount);
    } catch {
      /* noop */
    }
  }, [monthKey, dateYmd]);

  useEffect(() => {
    const id = window.setInterval(() => void fetchLive(), POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void fetchLive();
    };
    const onDashRefresh = () => void fetchLive();
    window.addEventListener("visibilitychange", onVis);
    window.addEventListener("bookment:dashboard-inicio-refresh", onDashRefresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("bookment:dashboard-inicio-refresh", onDashRefresh);
    };
  }, [fetchLive]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Turnos hoy", String(todayCount)],
          ["Turnos confirmados", String(upcoming)],
          ["Profesionales activos", String(staffCount)],
          ["Servicios activos", String(serviceCount)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Calendario</h2>
        <p className="mt-1 text-sm text-slate-600">
          Elegí un día en el calendario y mirá los turnos en la lista.
        </p>

        <div className="mt-6 flex flex-col gap-8 lg:grid lg:grid-cols-[26rem_minmax(0,1fr)] lg:items-start lg:gap-8">
          <div className="mx-auto w-full lg:mx-0 lg:w-auto">
            <DashboardHomeCalendar
              timeZone={timeZone}
              monthKey={monthKey}
              selectedYmd={dateYmd}
              todayYmd={todayYmd}
              counts={counts}
              daysInMonth={daysInMonth}
              prevHref={prevHref}
              nextHref={nextHref}
              monthTitle={monthTitle}
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold capitalize text-slate-900">{dayHeading}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {dayBookings.length === 0
                ? "No hay turnos este día."
                : `${dayBookings.length} turno${dayBookings.length === 1 ? "" : "s"}`}
            </p>

            {dayBookings.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                Tocá otro día en el calendario o esperá: las reservas nuevas aparecen solas.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {dayBookings.map((b) => (
                  <li
                    key={b.id}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {formatInTimeZone(new Date(b.startsAt), timeZone, "HH:mm")} — {b.customerName}
                      </p>
                      <p className="text-sm text-slate-600">
                        {b.service.name} · {b.staff.name}
                      </p>
                      <p className="text-sm text-slate-500">{b.customerPhone}</p>
                    </div>
                    <CancelBookingButton bookingId={b.id} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
