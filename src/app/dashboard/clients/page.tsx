import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { defaultTimeZone } from "@/lib/timezone";
import { getEffectivePlanId, planLabel } from "@/lib/plans";
import { es } from "date-fns/locale/es";
import { formatInTimeZone } from "date-fns-tz";

/** Siempre datos frescos (plan y reservas pueden cambiar sin redeploy). */
export const dynamic = "force-dynamic";

function waHref(phone: string, body?: string) {
  const n = phone.replace(/\D/g, "");
  if (!n) return null;
  return body
    ? `https://wa.me/${n}?text=${encodeURIComponent(body)}`
    : `https://wa.me/${n}`;
}

export default async function ClientsPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const tz = defaultTimeZone;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { subscriptionTier: true },
  });
  const tier = tenant?.subscriptionTier ?? "simple";
  const isPremium = getEffectivePlanId(tier) === "premium";
  const planName = planLabel(tier);

  const grouped = await prisma.booking.groupBy({
    by: ["customerPhone", "customerName"],
    where: { tenantId, status: "CONFIRMED" },
    _count: { _all: true },
    _max: { startsAt: true },
    _min: { startsAt: true },
    orderBy: { _count: { customerPhone: "desc" } },
    take: 80,
  });

  const top = grouped.slice(0, 5);
  const rest = grouped.slice(5);
  const restByLastVisit = [...rest].sort(
    (a, b) => (b._max.startsAt?.getTime() ?? 0) - (a._max.startsAt?.getTime() ?? 0),
  );
  const simpleRows = [...grouped].sort(
    (a, b) => (b._max.startsAt?.getTime() ?? 0) - (a._max.startsAt?.getTime() ?? 0),
  );

  const dateLabel = (d: Date | null) =>
    d ? formatInTimeZone(d, tz, "d MMM yyyy", { locale: es }) : "—";

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Clientes</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          {isPremium ? (
            <>
              Acá tenés <strong className="font-medium text-slate-800">quiénes más te eligieron</strong>{" "}
              y datos de contacto para seguimiento. El desglose por mes y montos está en{" "}
              <Link href="/dashboard/history" className="font-semibold text-teal-700 hover:underline">
                Historial
              </Link>
              .
            </>
          ) : (
            <>
              Listado de contactos que reservaron al menos una vez. El desglose por mes está en{" "}
              <Link href="/dashboard/history" className="font-semibold text-teal-700 hover:underline">
                Historial
              </Link>
              . El <strong className="font-medium text-slate-800">ranking de los 5 más frecuentes</strong>{" "}
              está incluido en el plan Premium.
            </>
          )}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Vista según tu plan: <span className="font-medium text-slate-700">{planName}</span>
          {isPremium ? " (top 5 con métricas completas)" : " (listado simplificado)"}.
        </p>
      </header>

      {grouped.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-600">
          Todavía no hay turnos confirmados. Cuando empiecen a reservar, vas a ver los contactos acá.
        </p>
      ) : isPremium ? (
        <>
          <section className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 shadow-md sm:p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900/90">
              Los 5 que más vinieron
            </h2>
            <p className="mt-1 text-sm text-amber-950/85">
              Por cantidad de turnos confirmados (histórico). Ideal para priorizar mensajes o promos.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-amber-200/80 bg-white/95">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-amber-200/90 bg-amber-100/60 text-xs font-semibold uppercase tracking-wide text-amber-900/80">
                      <th className="px-4 py-3 sm:px-5">#</th>
                      <th className="px-4 py-3 sm:px-5">Cliente</th>
                      <th className="px-4 py-3 sm:px-5">Visitas</th>
                      <th className="px-4 py-3 sm:px-5">Última</th>
                      <th className="hidden px-4 py-3 sm:table-cell sm:px-5">Primera</th>
                      <th className="w-24 px-4 py-3 sm:px-5" />
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((g, idx) => {
                      const wa = waHref(g.customerPhone, `Hola ${g.customerName}, ¿cómo estás?`);
                      return (
                        <tr
                          key={`${g.customerPhone}-${g.customerName}`}
                          className="border-b border-amber-100/70 last:border-0"
                        >
                          <td className="px-4 py-3 font-semibold tabular-nums text-amber-900 sm:px-5">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 sm:px-5">
                            <p className="font-medium text-slate-900">{g.customerName}</p>
                            <p className="text-slate-600">{g.customerPhone}</p>
                          </td>
                          <td className="px-4 py-3 font-semibold tabular-nums text-slate-900 sm:px-5">
                            {g._count._all}
                          </td>
                          <td className="px-4 py-3 text-slate-800 sm:px-5">
                            {dateLabel(g._max.startsAt)}
                          </td>
                          <td className="hidden px-4 py-3 text-slate-600 sm:table-cell sm:px-5">
                            {dateLabel(g._min.startsAt)}
                          </td>
                          <td className="px-4 py-3 sm:px-5">
                            {wa ? (
                              <a
                                href={wa}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-teal-700 hover:underline"
                              >
                                WA
                              </a>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {rest.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Más contactos
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Resto de personas con al menos un turno. Orden por última visita (más reciente
                primero). Sin conteo de visitas ni primera fecha en esta tabla.
              </p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[20rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3 sm:px-5">Cliente</th>
                        <th className="px-4 py-3 sm:px-5">Última visita</th>
                        <th className="px-4 py-3 sm:px-5">Teléfono</th>
                        <th className="w-20 px-4 py-3 sm:px-5" />
                      </tr>
                    </thead>
                    <tbody>
                      {restByLastVisit.map((g) => {
                        const wa = waHref(g.customerPhone);
                        return (
                          <tr
                            key={`${g.customerPhone}-${g.customerName}`}
                            className="border-b border-slate-100 last:border-0"
                          >
                            <td className="px-4 py-3 font-medium text-slate-900 sm:px-5">
                              {g.customerName}
                            </td>
                            <td className="px-4 py-3 text-slate-800 sm:px-5">
                              {dateLabel(g._max.startsAt)}
                            </td>
                            <td className="px-4 py-3 text-slate-700 sm:px-5">{g.customerPhone}</td>
                            <td className="px-4 py-3 sm:px-5">
                              {wa ? (
                                <a
                                  href={wa}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-semibold text-teal-700 hover:underline"
                                >
                                  WA
                                </a>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              {grouped.length >= 80 ? (
                <p className="mt-2 text-xs text-slate-500">
                  Ranking global limitado a los 80 contactos con más visitas. Detalle por mes en
                  Historial.
                </p>
              ) : null}
            </section>
          ) : null}
        </>
      ) : (
        <section className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 shadow-md sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900/90">
            Contactos
          </h2>
          <p className="mt-1 text-sm text-amber-950/85">
            Ordenados por <strong className="font-medium">última visita</strong> (más reciente
            primero). En esta vista no se muestran cantidad de visitas ni primera fecha.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-amber-200/80 bg-white/90">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[20rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-amber-200/90 bg-amber-100/50 text-xs font-semibold uppercase tracking-wide text-amber-900/80">
                    <th className="px-4 py-3 sm:px-5">Cliente</th>
                    <th className="px-4 py-3 sm:px-5">Última visita</th>
                    <th className="px-4 py-3 sm:px-5">Teléfono</th>
                    <th className="w-20 px-4 py-3 sm:px-5" />
                  </tr>
                </thead>
                <tbody>
                  {simpleRows.map((g) => {
                    const wa = waHref(g.customerPhone);
                    return (
                      <tr
                        key={`${g.customerPhone}-${g.customerName}`}
                        className="border-b border-amber-100/80 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900 sm:px-5">
                          {g.customerName}
                        </td>
                        <td className="px-4 py-3 text-slate-800 sm:px-5">
                          {dateLabel(g._max.startsAt)}
                        </td>
                        <td className="px-4 py-3 text-slate-700 sm:px-5">{g.customerPhone}</td>
                        <td className="px-4 py-3 sm:px-5">
                          {wa ? (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-teal-700 hover:underline"
                            >
                              WA
                            </a>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {grouped.length >= 80 ? (
            <p className="mt-3 text-xs text-amber-900/75">
              Mostrando hasta 80 contactos. Más detalle en Historial.
            </p>
          ) : null}
        </section>
      )}
    </div>
  );
}
