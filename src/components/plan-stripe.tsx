import { formatLimit, getEffectivePlanId, planDefinitionForTenant } from "@/lib/plans";

export function PlanStripe({ subscriptionTier }: { subscriptionTier: string }) {
  const id = getEffectivePlanId(subscriptionTier);
  const isPremium = id === "premium";
  const def = planDefinitionForTenant(subscriptionTier);

  return (
    <div
      className={
        isPremium
          ? "border-b border-violet-200 bg-violet-50/90 px-4 py-2 text-center text-sm text-violet-950"
          : "border-b border-slate-200 bg-slate-100/80 px-4 py-2 text-center text-sm text-slate-700"
      }
    >
      <span className="font-medium">Plan {def.label}</span>
      {!isPremium ? (
        <span className="text-slate-600">
          {" "}
          — Hasta <strong>{formatLimit(def.maxMonthlyBookings)}</strong> turnos/mes,{" "}
          <strong>{formatLimit(def.maxServices)}</strong> servicios,{" "}
          <strong>{formatLimit(def.maxStaff)}</strong> profesionales. Sin aviso WhatsApp al reservar
          por el link. Premium: insights, descarga de reservas y aviso al negocio.
        </span>
      ) : (
        <span className="text-violet-900">
          {" "}
          — Turnos ilimitados, descarga de reservas (Excel / CSV), insights de facturación y aviso por
          WhatsApp al reservar
          por el link.
        </span>
      )}
    </div>
  );
}
