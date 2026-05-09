"use client";

import Link from "next/link";
import { useState } from "react";
import { LockIcon, PremiumActiveBadge, PremiumLockedTeaser } from "@/components/premium-visuals";

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

  const premiumCard =
    !props.insightsLocked &&
    "rounded-xl border border-violet-200/90 bg-gradient-to-br from-violet-50/90 to-white p-4 shadow-sm ring-1 ring-violet-200/70";

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold capitalize text-slate-900">{props.monthLabel}</h2>
              {!props.insightsLocked ? <PremiumActiveBadge /> : null}
            </div>
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
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Todo el historial</h2>
            {!props.insightsLocked ? <PremiumActiveBadge /> : null}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Turnos confirmados
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{cuts}</p>
            <p className="mt-2 text-[11px] text-slate-500">Incluido en todos los planes</p>
          </div>
          <div
            className={`rounded-xl border p-4 ${
              props.insightsLocked
                ? "border-amber-300 border-dashed bg-amber-50/90"
                : premiumCard
            }`}
          >
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-600">
              {props.insightsLocked ? <LockIcon className="h-3.5 w-3.5" /> : null}
              {balanceLabel}
            </p>
            {props.insightsLocked ? (
              <p className="mt-2 text-sm font-medium leading-snug text-amber-950">
                Ves montos estimados y comparativas con <strong>Premium</strong> (precios por
                servicio).
              </p>
            ) : (
              <p className="mt-2 text-2xl font-bold tabular-nums text-violet-950">{revenue}</p>
            )}
          </div>
          <div
            className={`rounded-xl border p-4 ${
              props.insightsLocked
                ? "border-amber-300 border-dashed bg-amber-50/90"
                : premiumCard
            }`}
          >
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-600">
              {props.insightsLocked ? <LockIcon className="h-3.5 w-3.5" /> : null}
              {avgLabel}
            </p>
            {props.insightsLocked ? (
              <p className="mt-2 text-sm text-amber-950/90">Promedio por turno — mismo pack Premium.</p>
            ) : (
              <p className="mt-2 text-2xl font-bold tabular-nums text-violet-950">{avgAmount}</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{topTitle}</h3>
          {!props.insightsLocked ? <PremiumActiveBadge /> : null}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {props.insightsLocked
            ? "Ordená tu negocio viendo quiénes más te consumen turnos."
            : "Datos premium: quiénes más te eligen en el período."}
        </p>

        {props.insightsLocked ? (
          <div className="mt-4">
            <PremiumLockedTeaser
              title="Ranking de mejores clientes — incluido en Premium"
              footnote="Subiendo de plan ves el top con nombre, teléfono y cantidad de turnos, para premiar fidelidad o remarketing."
            >
              <p className="flex items-start gap-2">
                <span className="text-violet-600" aria-hidden>
                  ✓
                </span>
                Top clientes del mes y del histórico completo.
              </p>
              <p className="flex items-start gap-2">
                <span className="text-violet-600" aria-hidden>
                  ✓
                </span>
                Ideal para campañas y para saber en quién invertir tiempo.
              </p>
            </PremiumLockedTeaser>
          </div>
        ) : topItems.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Todavía no hay reservas confirmadas.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border border-violet-200 bg-violet-50/20 ring-1 ring-violet-200/60">
            <table className="w-full min-w-[320px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-violet-200 bg-violet-100/80 text-left text-xs font-semibold uppercase tracking-wide text-violet-950">
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
                    className="border-b border-violet-100/80 last:border-0 odd:bg-white even:bg-violet-50/40"
                  >
                    <td className="px-4 py-3.5 tabular-nums text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-900">{c.customerName}</td>
                    <td className="px-4 py-3.5 text-slate-600">{c.customerPhone}</td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-violet-950">
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
