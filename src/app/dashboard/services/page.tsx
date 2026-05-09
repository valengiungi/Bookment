import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getEffectivePlanId, planDefinitionForTenant } from "@/lib/plans";
import { CreateServicePanel } from "./create-service-panel";
import { ServiceItemActions } from "./service-item-actions";
import { StaffServicesPanel } from "./staff-services-panel";

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
      select: { subscriptionTier: true, sameServicesAllStaff: true },
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
  const planDef = planDefinitionForTenant(tenant?.subscriptionTier ?? "simple");
  const planId = getEffectivePlanId(tenant?.subscriptionTier ?? "simple");
  const serviceCap = planDef.maxServices;
  const atServiceLimit =
    planId === "simple" &&
    serviceCap != null &&
    services.length >= serviceCap;
  const blockNewServices = atServiceLimit;

  const createSection = <CreateServicePanel atServiceLimit={blockNewServices} />;

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
          {createSection}
        </div>
      ) : (
        createSection
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
