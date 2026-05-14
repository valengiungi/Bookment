import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardNav } from "@/components/dashboard-nav";
import { PlanStripe } from "@/components/plan-stripe";
import { UserBar } from "@/components/user-bar";
import {
  BOOKMENT_ADMIN_PHONE,
  bookmentAdminBlockedAccountHref,
} from "@/lib/admin-contact";
import { getDashboardActor, isEmployeeRole } from "@/lib/dashboard-actor";
import { withDbRetry } from "@/lib/db-retry";
import { prisma } from "@/lib/prisma";
import { getEffectivePlanId } from "@/lib/plans";
import { confirmedStartsThisMonthCount } from "@/lib/plan-limits";
import { defaultTimeZone } from "@/lib/timezone";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  const userId = session?.user?.id;
  if (!tenantId || !userId) {
    redirect("/login");
  }

  const [tenant, actor] = await withDbRetry(() =>
    Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
      }),
      getDashboardActor(userId, tenantId),
    ]),
  );
  if (!actor) {
    redirect("/login");
  }

  if (!tenant?.onboardingDone) {
    redirect("/onboarding");
  }

  const isEmployee = isEmployeeRole(actor.role);
  const planId = getEffectivePlanId(tenant.subscriptionTier);
  const monthlyBookingsUsed =
    !isEmployee && planId === "simple"
      ? await confirmedStartsThisMonthCount(tenantId, defaultTimeZone)
      : undefined;
  const blockedAccountHref = bookmentAdminBlockedAccountHref();

  if (!tenant.active) {
    return (
      <div className="flex min-h-full flex-col bg-[color:var(--background)]">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-start justify-between gap-2 px-4 py-3">
            <div className="min-w-0">
              <span className="text-lg font-semibold text-slate-900">{tenant.name}</span>
              <p className="truncate text-xs text-slate-500">Cuenta pausada temporalmente</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <UserBar email={session.user.email} />
            </div>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-10">
          <div className="w-full rounded-3xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
              Cuenta deshabilitada
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">
              Tu cuenta está deshabilitada
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              Por el momento no podés usar el panel. Por favor comunicate con el administrador
              para regularizar la cuenta.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {blockedAccountHref !== "#" ? (
                <a
                  href={blockedAccountHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
                >
                  Escribir por WhatsApp
                </a>
              ) : null}
              {blockedAccountHref !== "#" ? (
                <a
                  href={blockedAccountHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {BOOKMENT_ADMIN_PHONE}
                </a>
              ) : (
                <span className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-500">
                  {BOOKMENT_ADMIN_PHONE}
                </span>
              )}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Se abrirá WhatsApp con un mensaje listo: “Hola, tengo mi cuenta de Bookment
              bloqueada y no puedo usar el panel...”
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isEmployee && !actor.staffProfile?.active) {
    return (
      <div className="flex min-h-full flex-col bg-[color:var(--background)]">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-start justify-between gap-2 px-4 py-3">
            <div className="min-w-0">
              <span className="text-lg font-semibold text-slate-900">{tenant.name}</span>
              <p className="truncate text-xs text-slate-500">Perfil de profesional deshabilitado</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <UserBar email={session.user.email} />
            </div>
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-10">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
              Acceso pausado
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-slate-900">
              Tu perfil no está disponible
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              Por ahora no podés usar la agenda. Pedile al dueño del negocio que revise tu acceso
              de profesional dentro de Bookment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-[color:var(--background)]">
      {!isEmployee ? (
        <PlanStripe
          subscriptionTier={tenant.subscriptionTier}
          monthlyBookingsUsed={monthlyBookingsUsed}
        />
      ) : null}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-2 px-4 py-3">
          <div className="min-w-0">
            <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
              {tenant.name}
            </Link>
            <p className="truncate text-xs text-slate-500">
              {isEmployee && actor.staffProfile
                ? `Agenda de ${actor.staffProfile.name}`
                : `Público: /${tenant.slug}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <UserBar email={session.user.email} />
          </div>
        </div>
        <DashboardNav publicHref={`/${tenant.slug}`} role={actor.role} />
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
