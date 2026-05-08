import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { planLabel } from "@/lib/plans";
import { TenantSearchForm } from "./tenant-search-form";

export const dynamic = "force-dynamic";

export default async function AdminTenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: qRaw } = await searchParams;
  const q = (qRaw ?? "").trim();

  let tenants: {
    id: string;
    name: string;
    slug: string;
    active: boolean;
    subscriptionTier: string;
    onboardingDone: boolean;
    createdAt: Date;
    _count: { bookings: number; users: number };
  }[] = [];

  if (q.length >= 2) {
    tenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { users: { some: { email: { contains: q, mode: "insensitive" } } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        slug: true,
        active: true,
        subscriptionTier: true,
        onboardingDone: true,
        createdAt: true,
        _count: { select: { bookings: true, users: true } },
      },
    });
  } else if (q.length === 1) {
    tenants = [];
  } else {
    tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        name: true,
        slug: true,
        active: true,
        subscriptionTier: true,
        onboardingDone: true,
        createdAt: true,
        _count: { select: { bookings: true, users: true } },
      },
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">
          <Link href="/admin" className="text-teal-700 hover:underline">
            ← Panel
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Negocios</h1>
        <p className="mt-1 text-sm text-slate-600">
          Buscar por nombre, slug o email del usuario. Sin búsqueda, se muestran los últimos 30 altas.
        </p>
      </div>

      <TenantSearchForm initialQ={q} />

      {q.length === 1 ? (
        <p className="text-sm text-amber-800">Escribí al menos 2 caracteres para buscar.</p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Slug</th>
              <th className="px-4 py-2 font-medium">Plan</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Onboarding</th>
              <th className="px-4 py-2 font-medium">Reservas</th>
              <th className="px-4 py-2 font-medium w-28" />
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  {q.length >= 2 ? "No hay resultados." : "No hay negocios cargados."}
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="border-b border-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{t.name}</td>
                  <td className="px-4 py-2 text-slate-600">{t.slug}</td>
                  <td className="px-4 py-2 text-slate-600">{planLabel(t.subscriptionTier)}</td>
                  <td className="px-4 py-2">
                    {t.active ? (
                      <span className="text-emerald-800">Activo</span>
                    ) : (
                      <span className="text-slate-600">Pausado</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {t.onboardingDone ? "Sí" : "No"}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{t._count.bookings}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/tenants/${t.id}`}
                      className="font-medium text-teal-700 hover:underline"
                    >
                      Ver ficha
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
