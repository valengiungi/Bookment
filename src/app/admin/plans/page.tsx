import Link from "next/link";
import { formatLimit, PLAN_IDS, PLANS } from "@/lib/plans";

export default function AdminPlansPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">
          <Link href="/admin" className="text-teal-700 hover:underline">
            ← Panel
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Planes Simple y Premium</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PLAN_IDS.map((id) => {
          const p = PLANS[id];
          return (
            <div
              key={id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">{p.label}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">ID en base</dt>
                  <dd>
                    <code className="rounded bg-slate-100 px-1">{p.id}</code>
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Turnos / mes (confirmados)</dt>
                  <dd className="font-medium text-slate-900">
                    {formatLimit(p.maxMonthlyBookings)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Servicios</dt>
                  <dd className="font-medium text-slate-900">{formatLimit(p.maxServices)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Profesionales</dt>
                  <dd className="font-medium text-slate-900">{formatLimit(p.maxStaff)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Plata estimada + top clientes (Historial)</dt>
                  <dd className="font-medium text-slate-900">{p.allowRevenueInsights ? "Sí" : "No"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Descarga de reservas (Excel / CSV)</dt>
                  <dd className="font-medium text-slate-900">{p.allowDataExport ? "Sí" : "No"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">WhatsApp al negocio (reserva pública)</dt>
                  <dd className="font-medium text-slate-900">
                    {p.notifyBusinessOnPublicBooking ? "Sí" : "No"}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}
