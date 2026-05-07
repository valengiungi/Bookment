import { prisma } from "@/lib/prisma";

export default async function AdminHomePage() {
  const [active, inactive, bookings, tenants] = await Promise.all([
    prisma.tenant.count({ where: { active: true } }),
    prisma.tenant.count({ where: { active: false } }),
    prisma.booking.count(),
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        name: true,
        slug: true,
        active: true,
        subscriptionTier: true,
        createdAt: true,
        _count: { select: { bookings: true, users: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Panel plataforma</h1>
        <p className="mt-1 text-sm text-slate-600">
          Clientes (tenants), planes y métricas globales — base lista para crecer.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Tenants activos", String(active)],
          ["Tenants inactivos", String(inactive)],
          ["Reservas totales", String(bookings)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{k}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{v}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Últimos negocios</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Slug</th>
                <th className="px-4 py-2 font-medium">Plan</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Reservas</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{t.name}</td>
                  <td className="px-4 py-2 text-slate-600">{t.slug}</td>
                  <td className="px-4 py-2 text-slate-600">{t.subscriptionTier}</td>
                  <td className="px-4 py-2 text-slate-600">{t.active ? "Activo" : "Inactivo"}</td>
                  <td className="px-4 py-2 text-slate-600">{t._count.bookings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
