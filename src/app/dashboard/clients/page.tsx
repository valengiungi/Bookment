import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { defaultTimeZone } from "@/lib/timezone";
import { getEffectivePlanId } from "@/lib/plans";
import { es } from "date-fns/locale/es";
import { formatInTimeZone } from "date-fns-tz";
import { ClientsWaCell } from "./clients-wa-cell";

/** Siempre datos frescos (plan y reservas pueden cambiar sin redeploy). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clientes · WPP",
};

function waHref(phone: string, body?: string) {
  const n = phone.replace(/\D/g, "");
  if (!n) return null;
  return body
    ? `https://wa.me/${n}?text=${encodeURIComponent(body)}`
    : `https://wa.me/${n}`;
}

/** Icono estrella / brillo para la pastilla PREMIUM (cabecera de columna). */
function SparkleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 1l1.05 4.2L13.2 6.5l-4.15 1.3L8 12l-1.05-4.2L2.8 6.5l4.15-1.3L8 1z" />
    </svg>
  );
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

  const grouped = await prisma.booking.groupBy({
    by: ["customerPhone", "customerName"],
    where: { tenantId, status: "CONFIRMED" },
    _count: { _all: true },
    _max: { startsAt: true },
    _min: { startsAt: true },
    orderBy: { _count: { customerPhone: "desc" } },
    take: 80,
  });

  const rows = [...grouped].sort(
    (a, b) => (b._max.startsAt?.getTime() ?? 0) - (a._max.startsAt?.getTime() ?? 0),
  );

  const dateLabel = (d: Date | null) =>
    d ? formatInTimeZone(d, tz, "d MMM yyyy", { locale: es }) : "—";

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Clientes · WPP
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          {isPremium ? (
            <>
              Contactos con turnos confirmados, ordenados por{" "}
              <strong className="font-medium text-slate-800">última visita</strong>. Podés abrir
              WPP con un clic. El desglose por mes está en{" "}
              <Link href="/dashboard/history" className="font-semibold text-teal-700 hover:underline">
                Historial
              </Link>
              .
            </>
          ) : (
            <>
              Contactos con turnos confirmados, ordenados por última visita. El desglose por mes
              está en{" "}
              <Link href="/dashboard/history" className="font-semibold text-teal-700 hover:underline">
                Historial
              </Link>
              . <strong className="font-medium text-slate-800">WPP directo</strong> con cada cliente
              forma parte del plan Premium; para solicitarlo, comunicate con el administrador de
              Bookment (desde la columna WPP).
            </>
          )}
        </p>
      </header>

      {grouped.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-600">
          Todavía no hay turnos confirmados. Cuando empiecen a reservar, vas a ver los contactos acá.
        </p>
      ) : (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Contactos
          </h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table
                className={`w-full text-left text-sm ${isPremium ? "min-w-[42rem]" : "min-w-[32rem]"}`}
              >
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 sm:px-5">Cliente</th>
                    <th className="px-4 py-3 sm:px-5">Última visita</th>
                    {isPremium ? (
                      <th className="px-4 py-3 sm:px-5">Visitas</th>
                    ) : (
                      <th className="px-4 py-3 sm:px-5">Teléfono</th>
                    )}
                    <th
                      className={
                        isPremium
                          ? "min-w-[4.5rem] bg-violet-100/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ring-violet-400/85 sm:px-5"
                          : "min-w-[4.5rem] bg-amber-100/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ring-amber-200/70 sm:px-5"
                      }
                    >
                      {isPremium ? (
                        <div className="flex flex-col items-center gap-1.5 normal-case">
                          <span className="text-xs font-semibold uppercase tracking-wide text-violet-900/90">
                            WPP
                          </span>
                          <span className="inline-flex items-center gap-0.5 rounded-full border border-violet-500/60 bg-violet-200/50 px-2 py-0.5 text-[9px] font-bold tracking-wider text-violet-950">
                            <SparkleGlyph className="h-2.5 w-2.5 shrink-0 text-violet-800" />
                            PREMIUM
                          </span>
                        </div>
                      ) : (
                        "WPP"
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((g) => {
                    const wa = waHref(
                      g.customerPhone,
                      `Hola ${g.customerName}, ¿cómo estás?`,
                    );
                    return (
                      <tr
                        key={`${g.customerPhone}-${g.customerName}`}
                        className="border-b border-slate-100 bg-white last:border-b-0"
                      >
                        <td className="px-4 py-3 sm:px-5">
                          <p className="font-medium text-slate-900">{g.customerName}</p>
                          {isPremium ? (
                            <p className="text-slate-600">{g.customerPhone}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-slate-800 sm:px-5">
                          {dateLabel(g._max.startsAt)}
                        </td>
                        {isPremium ? (
                          <td className="px-4 py-3 font-semibold tabular-nums text-slate-900 sm:px-5">
                            {g._count._all}
                          </td>
                        ) : (
                          <td className="px-4 py-3 text-slate-700 sm:px-5">{g.customerPhone}</td>
                        )}
                        <td
                          className={
                            isPremium
                              ? "bg-violet-100/90 px-4 py-3 ring-1 ring-inset ring-violet-400/80 sm:px-5"
                              : "bg-amber-100/90 px-4 py-3 ring-1 ring-inset ring-amber-200/80 sm:px-5"
                          }
                        >
                          <ClientsWaCell isPremium={isPremium} href={wa} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
