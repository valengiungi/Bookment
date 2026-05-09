"use client";

import { useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { TimeSelect } from "@/components/time-select";
import { updateWorkingHours } from "@/app/dashboard/actions";

const days = [
  { id: 1, label: "Lun", labelLong: "Lunes" },
  { id: 2, label: "Mar", labelLong: "Martes" },
  { id: 3, label: "Mié", labelLong: "Miércoles" },
  { id: 4, label: "Jue", labelLong: "Jueves" },
  { id: 5, label: "Vie", labelLong: "Viernes" },
  { id: 6, label: "Sáb", labelLong: "Sábado" },
  { id: 0, label: "Dom", labelLong: "Domingo" },
];

export function HoursEditorCard({
  title,
  staffId,
  summary,
  initialRows,
  initialOpenDays,
  initialOpensAt,
  initialClosesAt,
}: {
  title: string;
  staffId: string;
  summary: string;
  initialRows: { dayOfWeek: number; opensAt: string; closesAt: string }[];
  initialOpenDays: number[];
  initialOpensAt: string;
  initialClosesAt: string;
}) {
  const [open, setOpen] = useState(false);
  const [openDays, setOpenDays] = useState<number[]>(initialOpenDays);
  const [opensAt, setOpensAt] = useState(initialOpensAt);
  const [closesAt, setClosesAt] = useState(initialClosesAt);
  const [useDifferentHours, setUseDifferentHours] = useState(() => {
    if (initialRows.length <= 1) return false;
    const first = initialRows[0];
    return initialRows.some(
      (r) => r.opensAt !== first.opensAt || r.closesAt !== first.closesAt,
    );
  });
  const [perDay, setPerDay] = useState(() => {
    const map: Record<number, { opensAt: string; closesAt: string }> = {};
    for (const d of days) {
      const row = initialRows.find((r) => r.dayOfWeek === d.id);
      map[d.id] = {
        opensAt: row?.opensAt ?? initialOpensAt,
        closesAt: row?.closesAt ?? initialClosesAt,
      };
    }
    return map;
  });

  function toggleDay(id: number) {
    setOpenDays((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  }

  function setPerDayTime(day: number, field: "opensAt" | "closesAt", value: string) {
    setPerDay((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  }

  const hasAnyHours = initialRows.length > 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50/90 via-white to-teal-50/30 px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              {title}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
              Semana tipo: qué días abrís y en qué franja. Es lo que usa la agenda pública para ofrecer
              turnos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            {open ? "Cerrar edición" : "Editar horarios"}
          </button>
        </div>

        {hasAnyHours ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {days.map((d) => {
              const row = initialRows.find((r) => r.dayOfWeek === d.id);
              const openDay = !!row;
              return (
                <div
                  key={`week-${staffId}-${d.id}`}
                  className={`flex min-h-[5.5rem] flex-col justify-center rounded-xl border px-3 py-3 text-center sm:min-h-[6.25rem] sm:px-4 ${
                    openDay
                      ? "border-teal-200/90 bg-teal-50/70 shadow-[inset_0_1px_0_0_rgba(20,184,166,0.12)]"
                      : "border-slate-100 bg-slate-50/80"
                  }`}
                >
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
                    <span className="sm:hidden">{d.label}</span>
                    <span className="hidden sm:inline">{d.labelLong}</span>
                  </p>
                  {openDay ? (
                    <p className="mt-2 text-base font-bold tabular-nums text-teal-900 sm:text-lg">
                      {row.opensAt}
                      <span className="mx-0.5 font-normal text-teal-700/80">–</span>
                      {row.closesAt}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm font-medium text-slate-400">Cerrado</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">Todavía no cargaste horarios</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{summary}</p>
          </div>
        )}
      </div>

      {open ? (
        <form
          action={updateWorkingHours}
          onSubmit={() => setOpen(false)}
          className="space-y-6 px-5 py-6 sm:px-7 sm:py-8"
        >
          <input type="hidden" name="staffId" value={staffId} />
          <input type="hidden" name="mode" value={useDifferentHours ? "full" : "compact"} />
          <input type="hidden" name="openDaysCsv" value={openDays.join(",")} />
          <input type="hidden" name="opensAt" value={opensAt} />
          <input type="hidden" name="closesAt" value={closesAt} />

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                checked={useDifferentHours}
                onChange={(e) => setUseDifferentHours(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Usar horarios distintos por día
            </label>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Días abiertos
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {days.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDay(d.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    openDays.includes(d.id)
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {!useDifferentHours ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-800">
                Desde
                <TimeSelect
                  name={`opensAt_${staffId}`}
                  value={opensAt}
                  onChange={setOpensAt}
                />
              </label>
              <label className="text-sm font-medium text-slate-800">
                Hasta
                <TimeSelect
                  name={`closesAt_${staffId}`}
                  value={closesAt}
                  onChange={setClosesAt}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              {days
                .filter((d) => openDays.includes(d.id))
                .map((d) => (
                  <div
                    key={`day-row-${staffId}-${d.id}`}
                    className="grid grid-cols-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:grid-cols-[7rem_1fr_1fr]"
                  >
                    <input type="hidden" name={`open_${d.id}`} value="on" />
                    <span className="text-sm font-semibold text-slate-800">{d.labelLong}</span>
                    <div>
                      <TimeSelect
                        name={`opensAt_${d.id}`}
                        value={perDay[d.id].opensAt}
                        onChange={(v) => setPerDayTime(d.id, "opensAt", v)}
                      />
                    </div>
                    <div>
                      <TimeSelect
                        name={`closesAt_${d.id}`}
                        value={perDay[d.id].closesAt}
                        onChange={(v) => setPerDayTime(d.id, "closesAt", v)}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}

          <FormSubmitButton
            idleText="Guardar horarios"
            loadingText="Guardando…"
            className="w-full bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 sm:w-auto"
          />
        </form>
      ) : null}
    </section>
  );
}
