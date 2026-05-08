import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getEffectivePlanId } from "@/lib/plans";
import { getEffectiveReportPrices } from "@/lib/platform-pricing";
import { formatArs } from "@/lib/subscription-pricing";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [active, inactive, inviteCodesFree, tiers] = await Promise.all([
    prisma.tenant.count({ where: { active: true } }),
    prisma.tenant.count({ where: { active: false } }),
    prisma.signupInviteCode.count({ where: { usedAt: null } }),
    prisma.tenant.findMany({
      where: { active: true },
      select: { subscriptionTier: true },
    }),
  ]);

  const activePlanCount = { simple: 0, premium: 0 };
  for (const t of tiers) {
    activePlanCount[getEffectivePlanId(t.subscriptionTier)] += 1;
  }
  const { simple: priceSimple, premium: pricePremium } = await getEffectiveReportPrices();
  const mrrTotal =
    activePlanCount.simple * priceSimple + activePlanCount.premium * pricePremium;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Panel Bookment</h1>
        <p className="mt-1 text-sm text-slate-600">
          Resumen corto. El detalle está en cada sección del menú.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-slate-500">Activos</span>{" "}
          <span className="font-semibold text-slate-900">{active}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-slate-500">Pausados</span>{" "}
          <span className="font-semibold text-slate-900">{inactive}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-slate-500">Códigos invitación libres</span>{" "}
          <span className="font-semibold text-slate-900">{inviteCodesFree}</span>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 shadow-sm">
          <span className="text-emerald-900">MRR estimado</span>{" "}
          <span className="font-semibold text-emerald-950">{formatArs(mrrTotal)}</span>
          <span className="text-emerald-800/80"> /mes</span>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Desglose de ingresos y métricas de la plataforma:{" "}
        <Link href="/admin/economia" className="font-medium text-teal-700 hover:underline">
          Economía
        </Link>
        .
      </p>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/tenants"
          className="rounded-2xl border-2 border-teal-200 bg-teal-50/80 p-5 shadow-sm transition hover:border-teal-400"
        >
          <p className="text-sm font-semibold text-teal-900">Negocios</p>
          <p className="mt-2 text-sm text-teal-800/90">
            Buscar, fichas, pausar, plan y notas internas.
          </p>
        </Link>
        <Link
          href="/admin/plans"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
        >
          <p className="text-sm font-semibold text-slate-900">Planes</p>
          <p className="mt-2 text-sm text-slate-600">Simple vs Premium y precios de lista.</p>
        </Link>
        <Link
          href="/admin/invites"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
        >
          <p className="text-sm font-semibold text-slate-900">Invitaciones</p>
          <p className="mt-2 text-sm text-slate-600">Códigos de un solo uso.</p>
        </Link>
        <Link
          href="/admin/economia"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
        >
          <p className="text-sm font-semibold text-slate-900">Economía</p>
          <p className="mt-2 text-sm text-slate-600">MRR, distribución por plan y métricas globales.</p>
        </Link>
      </section>
    </div>
  );
}
