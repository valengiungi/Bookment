import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getConfiguredListPrices } from "@/lib/platform-pricing";
import { formatLimit, planDefinitionForTenant, planLabel } from "@/lib/plans";
import {
  billingCycleLabel,
  formatAdminDate,
} from "../billing-utils";
import { TenantActiveToggle } from "../tenant-active-toggle";
import { TenantBillingForm } from "../tenant-billing-form";
import { TenantBillingStatusBadge } from "../tenant-billing-status-badge";
import { TenantNotesForm } from "../tenant-notes-form";
import { TenantPlanForm } from "../tenant-plan-form";

const DAY = 24 * 60 * 60 * 1000;

export const dynamic = "force-dynamic";

export default async function AdminTenantDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      active: true,
      subscriptionTier: true,
      adminNotes: true,
      onboardingDone: true,
      onboardingStep: true,
      createdAt: true,
      updatedAt: true,
      users: {
        select: { id: true, email: true, name: true, role: true },
        orderBy: { createdAt: "asc" },
      },
      billingPayments: {
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
        take: 20,
        select: {
          id: true,
          planId: true,
          billingCycle: true,
          amountArs: true,
          paidAt: true,
          nextDueAt: true,
          note: true,
        },
      },
      _count: {
        select: {
          bookings: true,
          services: true,
          staff: true,
        },
      },
    },
  });

  if (!tenant) notFound();

  const now = new Date();
  const from7 = new Date(now.getTime() - 7 * DAY);
  const from30 = new Date(now.getTime() - 30 * DAY);

  const [bookings7, bookings30] = await Promise.all([
    prisma.booking.count({
      where: { tenantId: tenant.id, createdAt: { gte: from7 } },
    }),
    prisma.booking.count({
      where: { tenantId: tenant.id, createdAt: { gte: from30 } },
    }),
  ]);

  const planDef = planDefinitionForTenant(tenant.subscriptionTier);
  const latestBillingPayment = tenant.billingPayments[0] ?? null;
  const { simple, premium } = await getConfiguredListPrices();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">
          <Link href="/admin/tenants" className="text-teal-700 hover:underline">
            ← Negocios
          </Link>
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{tenant.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              Slug público: <code className="rounded bg-slate-100 px-1">{tenant.slug}</code>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Alta:{" "}
              {tenant.createdAt.toLocaleString("es-AR", {
                dateStyle: "short",
                timeStyle: "short",
              })}{" "}
              · Última actualización:{" "}
              {tenant.updatedAt.toLocaleString("es-AR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          </div>
          <TenantActiveToggle tenantId={tenant.id} active={tenant.active} />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Reservas (7 días)", String(bookings7)],
          ["Reservas (30 días)", String(bookings30)],
          ["Reservas totales", String(tenant._count.bookings)],
          ["Servicios / Staff", `${tenant._count.services} / ${tenant._count.staff}`],
        ].map(([label, v]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{v}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Plan y límites definidos</h2>
        <p className="mt-1 text-sm text-slate-600">
          Plan efectivo: <strong>{planLabel(tenant.subscriptionTier)}</strong>
          {tenant.subscriptionTier !== planDef.id ? (
            <span className="text-slate-500">
              {" "}
              (valor en DB: <code className="rounded bg-slate-100 px-1">{tenant.subscriptionTier}</code>)
            </span>
          ) : null}
          <span className="mt-2 block text-sm">
            Turnos/mes: {formatLimit(planDef.maxMonthlyBookings)} · Servicios:{" "}
            {formatLimit(planDef.maxServices)} · Staff: {formatLimit(planDef.maxStaff)} ·
            Insights de plata: {planDef.allowRevenueInsights ? "sí" : "no"} · Descarga reservas:{" "}
            {planDef.allowDataExport ? "sí" : "no"}
          </span>
        </p>
        <div className="mt-4">
          <TenantPlanForm
            key={tenant.id}
            tenantId={tenant.id}
            currentTier={tenant.subscriptionTier}
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Detalle en{" "}
          <Link href="/admin/plans" className="text-teal-700 underline">
            Planes de la plataforma
          </Link>
          .
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-900">Cobros y vencimiento</h2>
          <p className="text-sm text-slate-600">
            Registrá cada pago para ver plan cobrado, importe, modalidad y próximo vencimiento.
          </p>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]">
          <div className="space-y-5">
            {latestBillingPayment ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Último pago
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatAdminDate(latestBillingPayment.paidAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Plan cobrado
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {planLabel(latestBillingPayment.planId)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Importe
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    ${latestBillingPayment.amountArs.toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Próximo vencimiento
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatAdminDate(latestBillingPayment.nextDueAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {billingCycleLabel(latestBillingPayment.billingCycle)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Estado
                  </p>
                  <div className="mt-2">
                    <TenantBillingStatusBadge nextDueAt={latestBillingPayment.nextDueAt} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm text-slate-500">
                Todavía no hay pagos registrados para este negocio.
              </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 font-medium">Fecha pago</th>
                    <th className="px-4 py-2 font-medium">Plan</th>
                    <th className="px-4 py-2 font-medium">Modalidad</th>
                    <th className="px-4 py-2 font-medium">Importe</th>
                    <th className="px-4 py-2 font-medium">Próximo venc.</th>
                    <th className="px-4 py-2 font-medium">Estado</th>
                    <th className="px-4 py-2 font-medium">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.billingPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No hay pagos cargados.
                      </td>
                    </tr>
                  ) : (
                    tenant.billingPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-slate-50 align-top">
                        <td className="px-4 py-3 text-slate-700">{formatAdminDate(payment.paidAt)}</td>
                        <td className="px-4 py-3 text-slate-700">{planLabel(payment.planId)}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {billingCycleLabel(payment.billingCycle)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          ${payment.amountArs.toLocaleString("es-AR")}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatAdminDate(payment.nextDueAt)}
                        </td>
                        <td className="px-4 py-3">
                          <TenantBillingStatusBadge nextDueAt={payment.nextDueAt} />
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {payment.note?.trim() ? payment.note : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="text-base font-semibold text-slate-900">Registrar pago</h3>
            <p className="mt-1 text-sm text-slate-600">
              El próximo vencimiento se calcula automáticamente desde la fecha de pago.
            </p>
            <div className="mt-4">
              <TenantBillingForm
                tenantId={tenant.id}
                currentTier={tenant.subscriptionTier}
                suggestedMonthlyAmounts={{ simple, premium }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Onboarding</h2>
        <p className="mt-1 text-sm text-slate-600">
          Completado: {tenant.onboardingDone ? "sí" : "no"} · Paso: {tenant.onboardingStep}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Usuarios del negocio</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {tenant.users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
              <span className="font-medium text-slate-900">{u.email}</span>
              <span className="text-slate-500">
                {u.name ? `${u.name} · ` : null}
                {u.role}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
        <h2 className="text-lg font-semibold text-amber-950">Notas internas (solo super admin)</h2>
        <p className="mt-1 text-sm text-amber-900/80">
          No las ve el cliente. Usalas para soporte, facturación o acuerdos.
        </p>
        <div className="mt-4">
          <TenantNotesForm tenantId={tenant.id} initialNotes={tenant.adminNotes} />
        </div>
      </section>
    </div>
  );
}
