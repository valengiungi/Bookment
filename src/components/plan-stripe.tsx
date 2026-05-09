import { formatLimit, getEffectivePlanId, planDefinitionForTenant } from "@/lib/plans";
import { LockIcon, PremiumActiveBadge } from "@/components/premium-visuals";

export function PlanStripe({
  subscriptionTier,
  monthlyBookingsUsed,
}: {
  subscriptionTier: string;
  /** Confirmados este mes (mes calendario, TZ del sistema). Solo plan Simple. */
  monthlyBookingsUsed?: number;
}) {
  const id = getEffectivePlanId(subscriptionTier);
  const isPremium = id === "premium";
  const def = planDefinitionForTenant(subscriptionTier);
  const limit = def.maxMonthlyBookings;
  const used =
    typeof monthlyBookingsUsed === "number" ? monthlyBookingsUsed : 0;
  const remaining =
    limit !== null ? Math.max(0, limit - used) : null;

  if (isPremium) {
    return (
      <div className="border-b border-violet-300/90 bg-gradient-to-r from-violet-50 via-white to-violet-50 px-4 py-3 text-center shadow-[inset_0_1px_0_0_rgba(139,92,246,0.15)]">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="font-semibold text-violet-950">Plan {def.label}</span>
          <PremiumActiveBadge />
        </div>
        <p className="mt-1.5 text-sm leading-snug text-violet-950/95">
          Tenés{" "}
          <strong className="text-violet-900">descarga Excel</strong>,{" "}
          <strong className="text-violet-900">insights de facturación</strong> en Historial y{" "}
          <strong className="text-violet-900">aviso por WhatsApp</strong> cuando reservan por tu link.
        </p>
      </div>
    );
  }

  return (
    <div className="border-b border-slate-200 bg-slate-100/90 px-4 py-3 text-center">
      <p className="text-sm text-slate-800">
        <span className="font-semibold">Plan {def.label}</span>
        <span className="text-slate-600">
          {" "}
          —{" "}
          {remaining !== null && remaining > 0 ? (
            <>
              Te quedan <strong className="text-slate-900">{remaining}</strong>
              {remaining === 1 ? " turno " : " turnos "}
              este mes{" "}
              <span className="text-slate-500">
                (con el plan Premium tenés ilimitados)
              </span>
              , hasta <strong>{formatLimit(def.maxServices)}</strong> servicios,{" "}
              <strong>{formatLimit(def.maxStaff)}</strong> profesionales.
            </>
          ) : remaining === 0 && limit !== null ? (
            <>
              Ya usaste los <strong className="text-slate-900">{limit}</strong> turnos incluidos
              este mes{" "}
              <span className="text-slate-500">
                (con el plan Premium tenés ilimitados)
              </span>
              . Hasta <strong>{formatLimit(def.maxServices)}</strong> servicios,{" "}
              <strong>{formatLimit(def.maxStaff)}</strong> profesionales.
            </>
          ) : (
            <>
              Hasta <strong>{formatLimit(def.maxMonthlyBookings)}</strong> turnos/mes,{" "}
              <strong>{formatLimit(def.maxServices)}</strong> servicios,{" "}
              <strong>{formatLimit(def.maxStaff)}</strong> profesionales.
            </>
          )}
        </span>
      </p>
      <p className="mx-auto mt-1 max-w-3xl text-xs leading-snug text-slate-600">
        Sin aviso por WhatsApp al negocio al reservar por el link. Premium: insights en Historial,
        descarga Excel y aviso al negocio.
      </p>
      <ul className="mx-auto mt-2 flex max-w-2xl flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-slate-600">
        <li className="flex items-center gap-1.5">
          <LockIcon className="h-3.5 w-3.5 text-amber-700/90" />
          <span>
            Excel con turnos + balance <span className="text-slate-400">(Premium)</span>
          </span>
        </li>
        <li className="flex items-center gap-1.5">
          <LockIcon className="h-3.5 w-3.5 text-amber-700/90" />
          <span>
            Montos y ranking en Historial <span className="text-slate-400">(Premium)</span>
          </span>
        </li>
        <li className="flex items-center gap-1.5">
          <LockIcon className="h-3.5 w-3.5 text-amber-700/90" />
          <span>
            WhatsApp al negocio al reservar <span className="text-slate-400">(Premium)</span>
          </span>
        </li>
      </ul>
    </div>
  );
}
