import Link from "next/link";
import { addMonths } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { getEffectivePlanId } from "@/lib/plans";
import {
  ensureEconomiaMonthSnapshot,
  ensurePlatformPricing,
  getConfiguredListPrices,
} from "@/lib/platform-pricing";
import { formatArs } from "@/lib/subscription-pricing";
import { defaultTimeZone } from "@/lib/timezone";
import { EconomiaPricingForm } from "./economia-pricing-form";

export const dynamic = "force-dynamic";

export default async function AdminEconomiaPage() {
  const tz = defaultTimeZone;
  const now = new Date();
  const monthStr = formatInTimeZone(now, tz, "yyyy-MM");
  const monthStart = toDate(`${monthStr}-01T00:00:00`, { timeZone: tz });
  const monthEnd = addMonths(monthStart, 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  await ensurePlatformPricing();
  const [configured, snapshots] = await Promise.all([
    getConfiguredListPrices(),
    prisma.economiaMonthSnapshot.findMany({
      orderBy: { monthKey: "desc" },
      take: 18,
    }),
  ]);

  const [
    active,
    inactive,
    bookingsTotal,
    bookingsMonth,
    newTenantsWeek,
    inviteCodesFree,
    tiers,
  ] = await Promise.all([
    prisma.tenant.count({ where: { active: true } }),
    prisma.tenant.count({ where: { active: false } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({
      where: {
        status: "CONFIRMED",
        startsAt: { gte: monthStart, lt: monthEnd },
      },
    }),
    prisma.tenant.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.signupInviteCode.count({ where: { usedAt: null } }),
    prisma.tenant.findMany({ select: { subscriptionTier: true, active: true } }),
  ]);

  const planCount = { simple: 0, premium: 0 };
  const activePlanCount = { simple: 0, premium: 0 };
  for (const t of tiers) {
    const k = getEffectivePlanId(t.subscriptionTier);
    planCount[k] += 1;
    if (t.active) activePlanCount[k] += 1;
  }

  await ensureEconomiaMonthSnapshot({
    monthKey: monthStr,
    activeSimple: activePlanCount.simple,
    activePremium: activePlanCount.premium,
    priceSimple: configured.simple,
    pricePremium: configured.premium,
  });

  const priceSimple = configured.simple;
  const pricePremium = configured.premium;
  const mrrSimple = activePlanCount.simple * priceSimple;
  const mrrPremium = activePlanCount.premium * pricePremium;
  const mrrTotal = mrrSimple + mrrPremium;

  const cards = [
    ["Negocios activos", String(active), "Con página pública operativa"],
    ["Negocios pausados", String(inactive), "No publican turnos"],
    ["Turnos confirmados (mes)", String(bookingsMonth), "Mes calendario, hora local AR"],
    ["Turnos confirmados (total)", String(bookingsTotal), "Histórico en la base"],
    ["Altas (últimos 7 días)", String(newTenantsWeek), "Nuevos negocios registrados"],
    ["Códigos invitación libres", String(inviteCodesFree), "Sin uso = nadie puede registrarse"],
  ] as const;

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm text-slate-500">
          <Link href="/admin" className="text-teal-700 hover:underline">
            ← Inicio
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Economía</h1>
        <p className="mt-1 text-sm text-slate-600">
          MRR estimado, distribución por plan y métricas globales de la plataforma.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Precios de lista</h2>
        <EconomiaPricingForm
          initialSimple={configured.simple}
          initialPremium={configured.premium}
        />
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-950">MRR estimado</h2>
        <p className="mt-1 text-sm text-emerald-900/85">
          Si <strong>todos los negocios activos</strong> pagaran el precio de lista actual. Los
          pausados no entran en la suma.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-white/90 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Activos · Simple
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
              {activePlanCount.simple}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              × {formatArs(priceSimple)} ={" "}
              <span className="font-semibold text-slate-900">{formatArs(mrrSimple)}</span>/mes
            </p>
          </div>
          <div className="rounded-xl border border-violet-100 bg-white/90 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Activos · Premium
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
              {activePlanCount.premium}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              × {formatArs(pricePremium)} ={" "}
              <span className="font-semibold text-slate-900">{formatArs(mrrPremium)}</span>/mes
            </p>
          </div>
          <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-600/10 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-900">Total MRR</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-950">{formatArs(mrrTotal)}</p>
            <p className="mt-1 text-xs text-emerald-900/90">por mes (ARS)</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-600">
          En la base: <strong>{planCount.simple}</strong> negocios Simple y{" "}
          <strong>{planCount.premium}</strong> Premium (incluye pausados). Cobrable arriba:{" "}
          <strong>{activePlanCount.simple + activePlanCount.premium}</strong> activos.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Historial de MRR (mensual)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Cada fila se guarda la primera vez que abrís Economía en ese mes calendario, con los
          precios de lista de ese momento y la cantidad de activos por plan. Las filas ya guardadas no
          se reescriben.
        </p>
        {snapshots.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Todavía no hay meses registrados.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4 font-medium">Mes</th>
                  <th className="py-2 pr-4 font-medium">Activos S / P</th>
                  <th className="py-2 pr-4 font-medium">Precio S / P</th>
                  <th className="py-2 font-medium">MRR</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => (
                  <tr key={s.monthKey} className="border-b border-slate-100">
                    <td className="py-2 pr-4 tabular-nums text-slate-900">{s.monthKey}</td>
                    <td className="py-2 pr-4 tabular-nums text-slate-700">
                      {s.activeSimple} / {s.activePremium}
                    </td>
                    <td className="py-2 pr-4 text-slate-700">
                      {formatArs(s.priceSimpleArs)} · {formatArs(s.pricePremiumArs)}
                    </td>
                    <td className="py-2 font-semibold tabular-nums text-slate-900">
                      {formatArs(s.mrrTotalArs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Negocios por plan (catalogados)</h2>
        <dl className="mt-4 flex flex-wrap gap-8">
          <div>
            <dt className="text-sm text-slate-500">Simple</dt>
            <dd className="text-2xl font-semibold text-slate-900">{planCount.simple}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Premium</dt>
            <dd className="text-2xl font-semibold text-slate-900">{planCount.premium}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Métricas globales</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(([title, value, hint]) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm text-slate-500">{title}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{hint}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
