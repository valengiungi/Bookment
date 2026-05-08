"use client";

import Link from "next/link";
import { useState } from "react";

export function HistorySummaryTabs(props: {
  monthLabel: string;
  monthCuts: number;
  monthRevenue: string;
  monthTop: { customerName: string; customerPhone: string; count: number }[];
  totalCuts: number;
  totalRevenue: string;
  totalTop: { customerName: string; customerPhone: string; count: number }[];
  prevMonthHref: string;
  nextMonthHref: string;
  canGoNextMonth: boolean;
  /** Simple: solo cantidad de turnos; sin plata estimada ni top clientes */
  insightsLocked: boolean;
}) {
  const [tab, setTab] = useState<"month" | "all">("month");
  const topTitle =
    tab === "month" ? "Top 5 clientes del mes" : "Top 5 clientes históricos";
  const topItems = tab === "month" ? props.monthTop : props.totalTop;

  return (
    <div className="space-y-4">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="rounded-2xl border border-slate-700/30 bg-slate-900/95 p-1 text-sm">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setTab("month")}
              className={`rounded-xl px-4 py-2.5 font-semibold transition ${
                tab === "month" ? "bg-white text-slate-900" : "text-slate-300"
              }`}
            >
              Este mes
            </button>
            <button
              type="button"
              onClick={() => setTab("all")}
              className={`rounded-xl px-4 py-2.5 font-semibold transition ${
                tab === "all" ? "bg-white text-slate-900" : "text-slate-300"
              }`}
            >
              Historial total
            </button>
          </div>
        </div>

        {tab === "month" ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 capitalize">{props.monthLabel}</h2>
              <div className="flex items-center gap-2">
                <Link
                  href={props.prevMonthHref}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  ← Mes anterior
                </Link>
                {props.canGoNextMonth ? (
                  <Link
                    href={props.nextMonthHref}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Mes siguiente →
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Cortes / turnos confirmados</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{props.monthCuts}</p>
              </div>
              <div
                className={`rounded-xl border p-3 ${
                  props.insightsLocked
                    ? "border-amber-200 bg-amber-50/80"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <p className="text-xs text-slate-500">Plata del mes (estimada)</p>
                {props.insightsLocked ? (
                  <p className="mt-1 text-sm font-medium text-amber-950">
                    Incluido en plan Premium — hablá con quien administra la plataforma.
                  </p>
                ) : (
                  <p className="mt-1 text-xl font-bold text-slate-900">{props.monthRevenue}</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
          <h2 className="font-semibold text-slate-900">Historial total</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Cortes / turnos confirmados</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{props.totalCuts}</p>
            </div>
            <div
              className={`rounded-xl border p-3 ${
                props.insightsLocked
                  ? "border-amber-200 bg-amber-50/80"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <p className="text-xs text-slate-500">Plata histórica (estimada)</p>
              {props.insightsLocked ? (
                <p className="mt-1 text-sm font-medium text-amber-950">
                  Plan Premium — mismo contacto que arriba.
                </p>
              ) : (
                <p className="mt-1 text-xl font-bold text-slate-900">{props.totalRevenue}</p>
              )}
            </div>
          </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-slate-500">{topTitle}</p>
        {props.insightsLocked ? (
          <p className="mt-2 text-sm text-amber-950">
            Ranking de clientes frecuentes: <strong>plan Premium</strong>.
          </p>
        ) : topItems.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Sin reservas confirmadas.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {topItems.map((c, idx) => (
              <li key={`${c.customerPhone}-${idx}`} className="text-sm text-slate-700">
                {idx + 1}. {c.customerName} ({c.customerPhone}) - {c.count} turnos
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
