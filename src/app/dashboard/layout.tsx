import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardNav } from "@/components/dashboard-nav";
import { PlanStripe } from "@/components/plan-stripe";
import { UserBar } from "@/components/user-bar";
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
  if (!tenantId) {
    redirect("/login");
  }

  const tenant = await withDbRetry(() =>
    prisma.tenant.findUnique({
      where: { id: tenantId },
    }),
  );

  if (!tenant?.onboardingDone) {
    redirect("/onboarding");
  }

  const planId = getEffectivePlanId(tenant.subscriptionTier);
  const monthlyBookingsUsed =
    planId === "simple"
      ? await confirmedStartsThisMonthCount(tenantId, defaultTimeZone)
      : undefined;

  return (
    <div className="flex min-h-full flex-col bg-[color:var(--background)]">
      <PlanStripe
        subscriptionTier={tenant.subscriptionTier}
        monthlyBookingsUsed={monthlyBookingsUsed}
      />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-2 px-4 py-3">
          <div className="min-w-0">
            <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
              {tenant.name}
            </Link>
            <p className="truncate text-xs text-slate-500">
              Público: /{tenant.slug}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <UserBar email={session.user.email} />
          </div>
        </div>
        <DashboardNav
          publicHref={`/${tenant.slug}`}
          isPremium={getEffectivePlanId(tenant.subscriptionTier) === "premium"}
        />
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
