import { auth } from "@/auth";
import { FormSubmitButton } from "@/components/form-submit-button";
import { prisma } from "@/lib/prisma";
import {
  addSuggestedService,
} from "@/app/dashboard/actions";
import { CreateServicePanel } from "./create-service-panel";
import { ServiceItemActions } from "./service-item-actions";

function suggestionsForBusinessType(businessType?: string | null) {
  const t = (businessType ?? "").toLowerCase();
  if (t.includes("barber") || t.includes("pelu")) {
    return [
      { name: "Corte", durationMinutes: 30 },
      { name: "Barba", durationMinutes: 25 },
      { name: "Corte + Barba", durationMinutes: 50 },
    ];
  }
  if (t.includes("odon")) {
    return [
      { name: "Consulta odontológica", durationMinutes: 30 },
      { name: "Control", durationMinutes: 20 },
      { name: "Limpieza", durationMinutes: 45 },
    ];
  }
  if (t.includes("psico")) {
    return [
      { name: "Sesión individual", durationMinutes: 50 },
      { name: "Sesión pareja", durationMinutes: 60 },
    ];
  }
  if (t.includes("nutri")) {
    return [
      { name: "Primera consulta", durationMinutes: 50 },
      { name: "Control nutricional", durationMinutes: 30 },
    ];
  }
  return [
    { name: "Turno general", durationMinutes: 30 },
    { name: "Consulta inicial", durationMinutes: 45 },
  ];
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ planLimit?: string }>;
}) {
  const { planLimit } = await searchParams;
  const session = await auth();
  const tenantId = session!.user.tenantId!;

  const [services, tenant] = await Promise.all([
    prisma.service.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { businessType: true },
    }),
  ]);
  const suggestions = suggestionsForBusinessType(tenant?.businessType);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-slate-900">Servicios</h1>

      {planLimit === "servicios" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Llegaste al máximo de servicios del plan <strong>Simple</strong>. Pedí{" "}
          <strong>Premium</strong> a quien administra la plataforma o eliminá servicios que no uses.
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Sugeridos para tu rubro</h2>
        <p className="mt-1 text-xs text-slate-500">
          Podés agregar solo los que te sirvan. Si no hacés barba, simplemente no la agregues
          o desactívala abajo.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <form key={s.name} action={addSuggestedService}>
              <input type="hidden" name="name" value={s.name} />
              <input
                type="hidden"
                name="durationMinutes"
                value={String(s.durationMinutes)}
              />
              <FormSubmitButton
                idleText={`+ ${s.name} (${s.durationMinutes} min)`}
                loadingText="Agregando…"
                className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs text-teal-800 hover:bg-teal-100"
              />
            </form>
          ))}
        </div>
      </section>

      <CreateServicePanel />

      <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {services.map((s) => (
          <li key={s.id} className="flex flex-col px-4 py-3 sm:flex-row sm:justify-between">
            <div>
              <p className="font-medium text-slate-900">{s.name}</p>
              <p className="text-sm text-slate-600">
                {s.durationMinutes} min
                {s.priceCents != null
                  ? ` · $${(s.priceCents / 100).toLocaleString("es-AR")}`
                  : ""}
              </p>
            </div>
            <ServiceItemActions
              serviceId={s.id}
              active={s.active}
              name={s.name}
              durationMinutes={s.durationMinutes}
              priceCents={s.priceCents}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
