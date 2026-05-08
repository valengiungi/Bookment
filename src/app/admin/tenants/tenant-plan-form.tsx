"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getEffectivePlanId, PLANS, PLAN_IDS, type PlanId } from "@/lib/plans";
import { setTenantPlanAction } from "./actions";

type Props = {
  tenantId: string;
  currentTier: string;
};

export function TenantPlanForm({ tenantId, currentTier }: Props) {
  const router = useRouter();
  const [value, setValue] = useState<PlanId>(() => getEffectivePlanId(currentTier));
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await setTenantPlanAction(tenantId, value);
    setLoading(false);
    if ("error" in res) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex flex-wrap items-end gap-3">
      <label className="block text-sm font-medium text-slate-700">
        Plan comercial
        <select
          value={value}
          onChange={(e) => setValue(e.target.value as PlanId)}
          className="mt-1 block w-full min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2"
        >
          {PLAN_IDS.map((id) => (
            <option key={id} value={id}>
              {PLANS[id].label} — {PLANS[id].short}
            </option>
          ))}
        </select>
      </label>
      {getEffectivePlanId(currentTier) !== currentTier ? (
        <p className="text-xs text-amber-800">
          Valor en base: <code className="rounded bg-amber-100 px-1">{currentTier}</code> (legacy; se muestra el
          plan equivalente arriba)
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading || value === currentTier}
        title={value === currentTier ? "Elegí otro plan o cambiá la selección" : undefined}
        className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {loading ? "Guardando…" : "Actualizar plan"}
      </button>
    </form>
  );
}
