"use client";

import { useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { TimeSelect } from "@/components/time-select";
import { updateWorkingHours } from "@/app/dashboard/actions";

const days = [
  { id: 1, label: "Lun" },
  { id: 2, label: "Mar" },
  { id: 3, label: "Mié" },
  { id: 4, label: "Jue" },
  { id: 5, label: "Vie" },
  { id: 6, label: "Sáb" },
  { id: 0, label: "Dom" },
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {initialOpenDays.length ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {days
                .filter((d) => initialOpenDays.includes(d.id))
                .map((d) => (
                  <span
                    key={`preview-${staffId}-${d.id}`}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700"
                  >
                    {d.label}
                  </span>
                ))}
              <span className="rounded-lg bg-teal-50 px-3 py-1.5 text-base font-bold text-teal-800">
                {initialOpensAt} - {initialClosesAt}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-500">{summary}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {open ? "Cerrar" : "Editar"}
        </button>
      </div>

      {open ? (
        <form
          action={updateWorkingHours}
          onSubmit={() => setOpen(false)}
          className="mt-4 space-y-4"
        >
          <input type="hidden" name="staffId" value={staffId} />
          <input type="hidden" name="mode" value={useDifferentHours ? "full" : "compact"} />
          <input type="hidden" name="openDaysCsv" value={openDays.join(",")} />
          <input type="hidden" name="opensAt" value={opensAt} />
          <input type="hidden" name="closesAt" value={closesAt} />

          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={useDifferentHours}
              onChange={(e) => setUseDifferentHours(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            Usar horarios distintos por día
          </label>

          <div className="flex flex-wrap gap-2">
            {days.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDay(d.id)}
                className={`rounded-full px-3 py-2 text-sm font-medium ${
                  openDays.includes(d.id)
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {!useDifferentHours ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-slate-700">
                Desde
                <TimeSelect
                  name={`opensAt_${staffId}`}
                  value={opensAt}
                  onChange={setOpensAt}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Hasta
                <TimeSelect
                  name={`closesAt_${staffId}`}
                  value={closesAt}
                  onChange={setClosesAt}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              {days
                .filter((d) => openDays.includes(d.id))
                .map((d) => (
                  <div
                    key={`day-row-${staffId}-${d.id}`}
                    className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 rounded-xl border border-slate-100 px-2 py-2"
                  >
                    <input type="hidden" name={`open_${d.id}`} value="on" />
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {d.label}
                    </span>
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
            className="bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
          />
        </form>
      ) : null}
    </div>
  );
}
