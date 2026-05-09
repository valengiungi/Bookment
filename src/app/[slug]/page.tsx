import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { confirmedStartsThisMonthCount } from "@/lib/plan-limits";
import { planDefinitionForTenant } from "@/lib/plans";
import { defaultTimeZone } from "@/lib/timezone";
import { PublicBooking } from "@/components/public-booking";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (isReservedSlug(slug)) return { title: "Bookment" };
  const tenant = await prisma.tenant.findFirst({
    where: { slug, active: true },
  });
  if (!tenant) return { title: "No encontrado" };
  return {
    title: `${tenant.name} — Reservar`,
    description: `Reservá turno en ${tenant.name}`,
  };
}

export default async function PublicTenantPage({ params }: Props) {
  const { slug } = await params;
  if (isReservedSlug(slug)) notFound();

  const session = await auth();
  if (session?.user?.role === "SUPER_ADMIN") {
    const adminRow = await prisma.tenant.findFirst({
      where: { slug },
      select: { id: true },
    });
    if (adminRow) redirect(`/admin/tenants/${adminRow.id}`);
    redirect(`/admin/tenants?q=${encodeURIComponent(slug)}`);
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug, active: true },
    include: {
      services: { where: { active: true }, orderBy: { name: "asc" } },
      staff: { where: { active: true }, orderBy: { name: "asc" } },
    },
  });

  if (!tenant) notFound();

  const plan = planDefinitionForTenant(tenant.subscriptionTier);
  const monthlyQuotaBlocked =
    plan.maxMonthlyBookings != null &&
    (await confirmedStartsThisMonthCount(tenant.id, defaultTimeZone)) >=
      plan.maxMonthlyBookings;

  return (
    <div className="min-h-full bg-slate-50">
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="sr-only">Reservar en {tenant.name}</h1>
        <PublicBooking
          slug={slug}
          whatsapp={tenant.whatsapp ?? ""}
          monthlyQuotaBlocked={monthlyQuotaBlocked}
          notifyBusinessOnBooking={plan.notifyBusinessOnPublicBooking}
          businessName={tenant.name}
          businessType={tenant.businessType}
          location={tenant.location}
          logoUrl={tenant.logoUrl}
          services={tenant.services.map((s) => ({
            id: s.id,
            name: s.name,
            durationMinutes: s.durationMinutes,
            priceCents: s.priceCents,
          }))}
          staff={tenant.staff.map((s) => ({ id: s.id, name: s.name }))}
        />
      </main>
    </div>
  );
}
