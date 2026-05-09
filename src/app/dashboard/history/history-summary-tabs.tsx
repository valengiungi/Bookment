"use client";

import Link from "next/link";
import { useState } from "react";

export function HistorySummaryTabs(props: {
  monthLabel: string;
  monthCuts: number;
  monthRevenue: string;
  monthAvgRevenue: string;
  monthTop: { customerName: string; customerPhone: string; count: number }[];
  totalCuts: number;
  totalRevenue: string;
  totalAvgRevenue: string;
  totalTop: { customerName: string; customerPhone: string; count: number }[];
  prevMonthHref: string;
  nextMonthHref: string;
  canGoNextMonth: boolean;
  insightsLocked: boolean;
}) {
  const [tab, setTab] = useState<"month" | "all">("month");
  const topTitle =
    tab === "month" ? "Clientes con más turnos (este mes)" : "Clientes con más turnos (histórico)";
  const topItems = tab === "month" ? props.monthTop : props.totalTop;

  const cuts = tab === "month" ? props.monthCuts : props.totalCuts;
  const revenue = tab === "month" ? props.monthRevenue : props.totalRevenue;
  const avgAmount = tab === "month" ? props.monthAvgRevenue : props.totalAvgRevenue;
  const balanceLabel =
    tab === "month" ? "Balance del mes (estimado)" : "Balance histórico total (estimado)";
  const avgLabel = tab === "month" ? "Promedio por turno (mes)" : "Promedio por turno (histórico)";

  return (
    <div className="space-y-10">
      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="rounded-2xl border border-slate-700/30 bg-slate-900/95 p-1 text-sm">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setTab("month")}
              className={`rounded-xl px-4 py-3 font-semibold transition ${
                tab === "month" ? "bg-white text-slate-900" : "text-slate-300"
              }`}
            >
              Este mes
            </button>
            <button
              type="button"
              onClick={() => setTab("all")}
              className={`rounded-xl px-4 py-3 font-semibold transition ${
                tab === "all" ? "bg-white text-slate-900" : "text-slate-300"
              }`}
            >
              Historial total
            </button>
          </div>
        </div>

        {tab === "month" ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold capitalize text-slate-900">{props.monthLabel}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={props.prevMonthHref}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                ← Mes anterior
              </Link>
              {props.canGoNextMonth ? (
                <Link
                  href={props.nextMonthHref}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Mes siguiente →
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <h2 className="text-lg font-semibold text-slate-900">Todo el historial</h2>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Turnos confirmados
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{cuts}</p>
          </div>
          <div
            className={`rounded-xl border p-4 ${
              props.insightsLocked
                ? "border-amber-200 bg-amber-50/80"
                : "border-teal-100 bg-teal-50/60"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
              {balanceLabel}
            </p>
            {props.insightsLocked ? (
              <p className="mt-2 text-sm font-medium leading-snug text-amber-950">
                Incluido en Premium (precios cargados en cada servicio).
              </p>
            ) : (
              <p className="mt-2 text-2xl font-bold tabular-nums text-teal-950">{revenue}</p>
            )}
          </div>
          <div
            className={`rounded-xl border p-4 ${
              props.insightsLocked ? "border-slate-100 bg-slate-50" : "border-slate-100 bg-slate-50"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {avgLabel}
            </p>
            {props.insightsLocked ? (
              <p className="mt-2 text-sm text-slate-500">—</p>
            ) : (
              <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{avgAmount}</p>
            )}
          </div>
        </div>

      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-sm font-semibold text-slate-900">{topTitle}</h3>
        <p className="mt-1 text-xs text-slate-500">
          Quienes más turnos sacaron en el período elegido (solo Premium).
        </p>

        {props.insightsLocked ? (
          <p className="mt-4 rounded-lg border border-amber-100 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            Ranking de clientes y montos estimados son parte del plan <strong>Premium</strong>.
          </p>
        ) : topItems.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Todavía no hay reservas confirmadas.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[320px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3 text-right">Turnos</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((c, idx) => (
                  <tr
                    key={`${c.customerPhone}-${idx}`}
                    className="border-b border-slate-100 last:border-0 odd:bg-white even:bg-slate-50/50"
                  >
                    <td className="px-4 py-3.5 tabular-nums text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">{c.customerName}</td>
                    <td className="px-4 py-3.5 text-slate-600">{c.customerPhone}</td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-900">
                      {c.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
