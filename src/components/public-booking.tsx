"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LoadingButton } from "@/components/loading-button";
import {
  formatCalendarDayHeading,
  formatCalendarMonthTitle,
  formatInstantDayHeading,
} from "@/lib/calendar-display";
import { defaultTimeZone } from "@/lib/timezone";
import { businessNotifyUrl } from "@/modules/notifications/whatsapp";
import { useToast } from "@/components/toast";

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number | null;
};

type Staff = { id: string; name: string };

type DayStatus = "past" | "closed" | "full" | "open" | "monthly_cap";

type Slot = { startsAt: string; label: string };

function monthKey(y: number, m: number) {
  return `${y}-${String(m).padStart(2, "0")}`;
}

function addMonth(y: number, m: number, delta: number) {
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Refresco en vivo: cambios en horarios/agenda del negocio se reflejan sin F5. */
const LIVE_POLL_MS = 12_000;

const cellClass: Record<DayStatus, string> = {
  past: "cursor-not-allowed bg-slate-200 text-slate-500",
  closed: "cursor-not-allowed bg-slate-200 text-slate-500",
  full: "cursor-not-allowed bg-rose-100 text-rose-900 ring-1 ring-rose-200/80",
  monthly_cap:
    "cursor-not-allowed bg-amber-50 text-amber-950 ring-1 ring-amber-200/90",
  open: "cursor-pointer bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300/80 hover:bg-emerald-200",
};

function whatsappCoordinationHref(businessWhatsapp: string) {
  const num = businessWhatsapp.replace(/\D/g, "");
  if (!num) return null;
  const text =
    "Hola, quería coordinar un turno (desde la web dice que este mes ya no hay más cupo online).";
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

export function PublicBooking(props: {
  slug: string;
  whatsapp: string;
  /** Plan Simple: cupo mensual de reservas web agotado (servidor + API coinciden). */
  monthlyQuotaBlocked?: boolean;
  /** Si es false (plan Simple), no se abre ni se ofrece WhatsApp al negocio tras reservar. */
  notifyBusinessOnBooking: boolean;
  businessName: string;
  businessType: string | null;
  location: string | null;
  logoUrl: string | null;
  services: Service[];
  staff: Staff[];
}) {
  const nowInit = useMemo(() => new Date(), []);
  const initialMonth = useMemo(() => {
    return {
      y: nowInit.getFullYear(),
      m: nowInit.getMonth() + 1,
    };
  }, [nowInit]);

  const [viewY, setViewY] = useState(initialMonth.y);
  const [viewM, setViewM] = useState(initialMonth.m);
  const [dayMap, setDayMap] = useState<Record<string, DayStatus>>({});
  const [firstPad, setFirstPad] = useState(0);
  const [daysInMonth, setDaysInMonth] = useState(31);
  const [todayYmd, setTodayYmd] = useState(() => nowInit.toISOString().slice(0, 10));
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [monthlyQuotaBlocked, setMonthlyQuotaBlocked] = useState(
    props.monthlyQuotaBlocked === true,
  );

  const [selectedYmd, setSelectedYmd] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState(props.services[0]?.id ?? "");
  const [staffId, setStaffId] = useState(props.staff[0]?.id ?? "");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotPick, setSlotPick] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const { showToast } = useToast();

  const monthStr = monthKey(viewY, viewM);
  const monthTitle = useMemo(
    () => formatCalendarMonthTitle(monthStr, defaultTimeZone),
    [monthStr],
  );

  const service = useMemo(
    () => props.services.find((s) => s.id === serviceId),
    [props.services, serviceId],
  );

  const loadCalendar = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      if (!silent) {
        setCalendarLoading(true);
        setDayMap({});
        setFirstPad(0);
        setDaysInMonth(31);
      }
      const res = await fetch(`/api/public/${props.slug}/availability?month=${monthStr}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!silent) setCalendarLoading(false);
      if (!res.ok) {
        if (!silent) {
          showToast(typeof data.error === "string" ? data.error : "No se pudo cargar el calendario", "error");
        }
        return;
      }
      if (data.todayYmd) setTodayYmd(data.todayYmd);
      if (typeof data.monthlyQuotaBlocked === "boolean") {
        setMonthlyQuotaBlocked(data.monthlyQuotaBlocked);
      }
      if (typeof data.firstWeekdayMon0 === "number") setFirstPad(data.firstWeekdayMon0);
      if (typeof data.daysInMonth === "number") setDaysInMonth(data.daysInMonth);
      setDayMap(typeof data.days === "object" && data.days ? data.days : {});
    },
    [props.slug, monthStr, showToast],
  );

  useEffect(() => {
    // Cargar grilla del mes al montar o al cambiar mes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch + setState acotado al calendario público
    void loadCalendar();
  }, [loadCalendar]);

  const loadSlots = useCallback(
    async (dateYmd: string, opts?: { silent?: boolean }) => {
      if (!serviceId || !staffId || !dateYmd) return;
      const silent = opts?.silent === true;
      if (!silent) {
        setSlotsLoading(true);
        setError(null);
        setSlotPick(null);
      }
      const res = await fetch(
        `/api/public/${props.slug}/slots?serviceId=${encodeURIComponent(serviceId)}&staffId=${encodeURIComponent(staffId)}&date=${encodeURIComponent(dateYmd)}`,
        { cache: "no-store" },
      );
      const data = await res.json().catch(() => ({}));
      if (!silent) setSlotsLoading(false);
      if (!res.ok) {
        const msg =
          typeof data.error === "string" ? data.error : "No se pudieron cargar horarios";
        if (!silent) {
          setError(msg);
          showToast(msg, "error");
          setSlots([]);
        }
        return;
      }
      const nextSlots = Array.isArray(data.slots) ? data.slots : [];
      setSlots(nextSlots);
      if (silent) {
        setSlotPick((prev) => {
          if (!prev) return prev;
          return nextSlots.some((s: Slot) => s.startsAt === prev.startsAt) ? prev : null;
        });
      }
    },
    [props.slug, serviceId, staffId, showToast],
  );

  useEffect(() => {
    const refreshLive = () => {
      void loadCalendar({ silent: true });
      if (selectedYmd) void loadSlots(selectedYmd, { silent: true });
    };
    const id = window.setInterval(refreshLive, LIVE_POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") refreshLive();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [loadCalendar, loadSlots, selectedYmd]);

  useEffect(() => {
    if (!selectedYmd || !serviceId || !staffId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- depende de selects dentro del panel
    void loadSlots(selectedYmd);
  }, [selectedYmd, serviceId, staffId, loadSlots]);

  function openDay(ymd: string, status: DayStatus) {
    if (status !== "open") return;
    setDone(false);
    setSelectedYmd(ymd);
    setError(null);
    setSlotPick(null);
    setName("");
    setPhone("");
  }

  function closePanel() {
    setSelectedYmd(null);
    setDone(false);
    setSlotPick(null);
    setError(null);
  }

  async function submit() {
    if (!slotPick || !selectedYmd) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/public/${props.slug}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        staffId,
        startsAt: slotPick.startsAt,
        customerName: name,
        customerPhone: phone,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      const msg = typeof data.error === "string" ? data.error : "No se pudo reservar";
      setError(msg);
      showToast(msg, "error");
      return;
    }
    showToast("Reserva confirmada", "success");
    setDone(true);
    void loadCalendar({ silent: true });

    if (props.notifyBusinessOnBooking && service) {
      const dateLabel = formatInstantDayHeading(slotPick.startsAt, defaultTimeZone);
      const wa = businessNotifyUrl({
        businessWhatsapp: props.whatsapp,
        customerName: name,
        dateLabel,
        timeLabel: slotPick.label,
        serviceName: service.name,
      });
      if (wa) {
        window.open(wa, "_blank", "noopener,noreferrer");
      }
    }
  }

  function shiftMonth(delta: number) {
    const n = addMonth(viewY, viewM, delta);
    setViewY(n.y);
    setViewM(n.m);
  }

  if (!props.services.length || !props.staff.length) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Este negocio todavía no tiene servicios o profesionales configurados.
      </p>
    );
  }

  const padCells = Array.from({ length: firstPad }, (_, i) => (
    <div key={`pad-${i}`} className="aspect-square" aria-hidden />
  ));
  const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const ymd = `${viewY}-${String(viewM).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const st = calendarLoading ? "past" : (dayMap[ymd] ?? "closed");
    const isToday = ymd === todayYmd;
    return (
      <button
        key={ymd}
        type="button"
        disabled={calendarLoading || st !== "open"}
        onClick={() => openDay(ymd, st)}
        className={`flex aspect-square items-center justify-center rounded-xl text-sm font-semibold transition ${cellClass[st]} ${
          isToday && st === "open" ? "ring-2 ring-teal-500 ring-offset-2" : ""
        } ${isToday && st !== "open" ? "ring-1 ring-slate-400" : ""}`}
      >
        {dayNum}
      </button>
    );
  });

  const selectedDateLabel =
    selectedYmd != null ? formatCalendarDayHeading(selectedYmd, defaultTimeZone) : "";

  let notifyUrl: string | null = null;
  if (done && slotPick && service) {
    notifyUrl = businessNotifyUrl({
      businessWhatsapp: props.whatsapp,
      customerName: name,
      dateLabel: formatInstantDayHeading(slotPick.startsAt, defaultTimeZone),
      timeLabel: slotPick.label,
      serviceName: service.name,
    });
  }

  const subtitle = [props.businessType, props.location]
    .filter((s): s is string => Boolean(s && s.trim()))
    .join(", ");
  const coordinationWa = whatsappCoordinationHref(props.whatsapp);

  return (
    <div className="relative space-y-10">
      <header className="flex w-full flex-row items-center gap-5 rounded-2xl border border-slate-200/80 bg-white px-5 py-6 shadow-sm sm:gap-10 sm:px-10 sm:py-8">
        <div className="min-w-0 flex-1 text-left">
          <p className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {props.businessName}
          </p>
          {subtitle ? (
            <p className="mt-2 text-base leading-snug text-slate-600 sm:text-lg">{subtitle}</p>
          ) : null}
        </div>
        <div className="shrink-0">
          {props.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={props.logoUrl}
              alt=""
              className="h-20 w-20 rounded-2xl object-cover shadow-md sm:h-28 sm:w-28"
            />
          ) : (
            <div className="flex sm:h-28 sm:w-28 h-20 w-20 items-center justify-center rounded-2xl bg-teal-100 text-2xl font-bold text-teal-800 shadow-md sm:text-3xl">
              {props.businessName.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      </header>

      {monthlyQuotaBlocked ? (
        <div
          className="rounded-2xl border border-amber-300 bg-amber-50/95 px-4 py-4 text-sm text-amber-950 shadow-sm sm:px-5"
          role="status"
        >
          <p className="font-semibold">Este mes no hay más turnos disponibles por la web</p>
          <p className="mt-2 leading-relaxed text-amber-950/95">
            El profesional ya no puede recibir más reservas por la página: llegó al máximo de turnos
            online de su plan para este mes calendario.
          </p>
          {coordinationWa ? (
            <>
              <p className="mt-3 font-medium text-amber-950">Coordiná por WhatsApp:</p>
              <a
                href={coordinationWa}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex min-h-10 items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Abrir WhatsApp
              </a>
            </>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-amber-900/90">
              Si tenés el WhatsApp o teléfono del negocio, contactalo por ahí para ver disponibilidad.
            </p>
          )}
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-lg">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                aria-label="Mes anterior"
              >
                ‹
              </button>
              <p className="text-center text-sm font-semibold capitalize text-slate-900">
                {calendarLoading ? "…" : monthTitle}
              </p>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                aria-label="Mes siguiente"
              >
                ›
              </button>
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

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-slate-200 ring-1 ring-slate-300/80" />
                No atiende
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-rose-100 ring-1 ring-rose-200/80" />
                Completo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-amber-50 ring-1 ring-amber-200/90" />
                Sin cupo web
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-300/80" />
                Con lugar
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Tocá un día en verde para elegir servicio, profesional y horario.
            </p>
          </div>
        </div>

      {selectedYmd ? (
        <>
          <button
            type="button"
            aria-label="Cerrar"
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] transition"
            onClick={closePanel}
          />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                  Reservar
                </p>
                <p className="mt-1 text-lg font-semibold capitalize text-slate-900">
                  {selectedDateLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {done && slotPick && service ? (
                <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-5 text-center">
                  <p className="text-base font-semibold text-teal-900">
                    ¡Listo! Tu turno quedó registrado.
                  </p>
                  {props.notifyBusinessOnBooking ? (
                    <>
                      <p className="mt-2 text-sm text-teal-800">
                        Si no se abrió WhatsApp, podés avisar al negocio desde acá.
                      </p>
                      {notifyUrl ? (
                        <a
                          href={notifyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white"
                        >
                          Abrir WhatsApp
                        </a>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-teal-800">
                      El negocio verá tu reserva en su agenda al ingresar al panel.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={closePanel}
                    className="mt-3 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Volver al calendario
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-800">
                    Servicio
                    <select
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-base"
                    >
                      {props.services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {s.priceCents != null
                            ? ` — $${(s.priceCents / 100).toLocaleString("es-AR")}`
                            : ""}{" "}
                          ({s.durationMinutes} min)
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-medium text-slate-800">
                    Profesional
                    <select
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-base"
                    >
                      {props.staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {slotsLoading ? (
                    <p className="text-sm text-slate-500">Cargando horarios…</p>
                  ) : slots.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-slate-800">Horario</p>
                      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {slots.map((s) => (
                          <button
                            key={s.startsAt}
                            type="button"
                            onClick={() => setSlotPick(s)}
                            className={`rounded-xl py-2 text-sm font-medium ${
                              slotPick?.startsAt === s.startsAt
                                ? "bg-teal-600 text-white"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">
                      No hay horarios libres para esta combinación. Probá otro profesional o
                      servicio.
                    </p>
                  )}

                  {slotPick ? (
                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <label className="block text-sm font-medium text-slate-800">
                        Tu nombre
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-base"
                          autoComplete="name"
                        />
                      </label>
                      <label className="block text-sm font-medium text-slate-800">
                        Teléfono
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-base"
                          autoComplete="tel"
                        />
                      </label>
                      <LoadingButton
                        type="button"
                        loading={submitting}
                        loadingText="Reservando…"
                        idleText="Reservar"
                        disabled={name.length < 2 || phone.length < 6}
                        onClick={() => void submit()}
                        className="w-full bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700"
                      />
                    </div>
                  ) : null}

                  {error ? <p className="text-sm text-red-600">{error}</p> : null}
                </div>
              )}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
