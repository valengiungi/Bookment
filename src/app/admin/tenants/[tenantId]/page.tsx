import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatLimit, planDefinitionForTenant, planLabel } from "@/lib/plans";
import { TenantActiveToggle } from "../tenant-active-toggle";
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
