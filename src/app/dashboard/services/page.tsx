import { auth } from "@/auth";
import { FormSubmitButton } from "@/components/form-submit-button";
import { prisma } from "@/lib/prisma";
import { getEffectivePlanId, planDefinitionForTenant } from "@/lib/plans";
import {
  addSuggestedService,
} from "@/app/dashboard/actions";
import { CreateServicePanel } from "./create-service-panel";
import { ServiceItemActions } from "./service-item-actions";
import { StaffServicesPanel } from "./staff-services-panel";

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
  searchParams?: Promise<{ staffServices?: string }>;
}) {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const sp = searchParams ? await searchParams : {};
  const staffServicesMsg =
    sp.staffServices === "ok"
      ? "Servicios del profesional guardados."
      : sp.staffServices === "mode"
        ? "Activá primero «Servicios distintos por profesional» y volvé a intentar."
        : sp.staffServices === "err"
          ? "No se pudo guardar. Revisá que el profesional siga activo."
          : null;

  const [services, tenant, staffList, staffServiceLinks] = await Promise.all([
    prisma.service.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { businessType: true, subscriptionTier: true, sameServicesAllStaff: true },
    }),
    prisma.staff.findMany({
      where: { tenantId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.staffService.findMany({
      where: { staff: { tenantId, active: true } },
      select: { staffId: true, serviceId: true },
    }),
  ]);

  const selectedByStaffId: Record<string, string[]> = {};
  for (const l of staffServiceLinks) {
    if (!selectedByStaffId[l.staffId]) selectedByStaffId[l.staffId] = [];
    selectedByStaffId[l.staffId].push(l.serviceId);
  }
  const sameServicesAllStaff = tenant?.sameServicesAllStaff ?? true;
  const suggestions = suggestionsForBusinessType(tenant?.businessType);
  const planDef = planDefinitionForTenant(tenant?.subscriptionTier ?? "simple");
  const planId = getEffectivePlanId(tenant?.subscriptionTier ?? "simple");
  const serviceCap = planDef.maxServices;
  const atServiceLimit =
    planId === "simple" &&
    serviceCap != null &&
    services.length >= serviceCap;
  /** Solo cuando el cupo real está lleno; el redirect ?planLimit= queda en la URL pero no bloquea si liberó lugar. */
  const blockNewServices = atServiceLimit;

  const addServicesSection = (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="text-base font-semibold tracking-tight text-slate-900">
          Sugeridos para tu rubro
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Podés agregar solo los que te sirvan. Si no hacés barba, simplemente no la agregues o
          desactívala abajo.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
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
                disabled={blockNewServices}
                className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs text-teal-800 hover:bg-teal-100 disabled:cursor-not-allowed disabled:hover:bg-teal-50"
              />
            </form>
          ))}
        </div>
      </section>

      <CreateServicePanel atServiceLimit={blockNewServices} />
    </>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-slate-900">Servicios</h1>

      {staffServicesMsg ? (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            sp.staffServices === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-950"
          }`}
        >
          {staffServicesMsg}
        </p>
      ) : null}

      {blockNewServices ? (
        <div className="space-y-4 rounded-2xl border-2 border-amber-400 bg-amber-50/80 p-4 shadow-sm sm:p-5">
          <p className="text-sm font-medium leading-relaxed text-amber-950">
            Con el plan <strong>Simple</strong> no podés añadir más servicios: llegaste al máximo (
            {serviceCap ?? services.length} incluidos). Para tener más, adquirí el plan{" "}
            <strong>Premium</strong> (servicios ilimitados) o eliminá alguno de la lista que no uses.
          </p>
          {addServicesSection}
        </div>
      ) : (
        addServicesSection
      )}

      <StaffServicesPanel
        sameServicesAllStaff={sameServicesAllStaff}
        staff={staffList}
        services={services.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name }))}
        selectedByStaffId={selectedByStaffId}
      />

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
