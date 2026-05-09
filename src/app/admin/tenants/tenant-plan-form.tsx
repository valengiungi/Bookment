"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { getEffectivePlanId, PLANS, PLAN_IDS, type PlanId, isPlanId } from "@/lib/plans";
import { setTenantPlanAction } from "./actions";

type Props = {
  tenantId: string;
  currentTier: string;
};

/** Botón deshabilitado solo si ya está guardado el mismo plan canónico (simple/premium). */
function isSameCanonicalPlan(currentTier: string, selected: PlanId): boolean {
  const effective = getEffectivePlanId(currentTier);
  if (effective !== selected) return false;
  return isPlanId(currentTier) && currentTier === selected;
}

export function TenantPlanForm({ tenantId, currentTier }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [value, setValue] = useState<PlanId>(() => getEffectivePlanId(currentTier));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(getEffectivePlanId(currentTier));
  }, [currentTier]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await setTenantPlanAction(tenantId, value);
    setLoading(false);
    if ("error" in res) {
      showToast(res.error ?? "No se pudo guardar.", "error");
      return;
    }
    showToast("Plan actualizado. El negocio ve los cambios al refrescar el panel.", "success");
    router.refresh();
  }

  const disabledSubmit = loading || isSameCanonicalPlan(currentTier, value);

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm font-medium text-slate-700">
          Plan
          <select
            value={value}
            onChange={(e) => setValue(e.target.value as PlanId)}
            className="mt-1 block w-full min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500 focus:ring-2"
          >
            {PLAN_IDS.map((id) => (
              <option key={id} value={id}>
                {PLANS[id].label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={disabledSubmit}
          title={
            disabledSubmit && !loading
              ? "Ya está asignado este plan"
              : "Guardar cambio de plan"
          }
          className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Guardando…" : "Guardar plan"}
        </button>
      </div>
      {getEffectivePlanId(currentTier) !== currentTier ? (
        <p className="text-xs text-amber-800">
          Valor antiguo en base:{" "}
          <code className="rounded bg-amber-100 px-1">{currentTier}</code> — al guardar se guarda{" "}
          <strong>{value}</strong>.
        </p>
      ) : null}
    </form>
  );
}
