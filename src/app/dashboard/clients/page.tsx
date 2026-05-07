import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function ClientsPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId!;

  const grouped = await prisma.booking.groupBy({
    by: ["customerPhone", "customerName"],
    where: { tenantId },
    _count: { _all: true },
    orderBy: { _count: { customerPhone: "desc" } },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Clientes</h1>
      <p className="text-sm text-slate-600">
        Derivado de reservas históricas (teléfono + nombre).
      </p>
      <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {grouped.length === 0 ? (
          <li className="p-6 text-center text-slate-500">Todavía no hay datos.</li>
        ) : (
          grouped.map((g) => (
            <li key={`${g.customerPhone}-${g.customerName}`} className="flex flex-col px-4 py-3 sm:flex-row sm:justify-between">
              <div>
                <p className="font-medium text-slate-900">{g.customerName}</p>
                <p className="text-sm text-slate-600">{g.customerPhone}</p>
              </div>
              <p className="text-sm text-slate-500">{g._count._all} reservas</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
