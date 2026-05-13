"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useToast } from "@/components/toast";
import { getEffectivePlanId, PLANS, PLAN_IDS, type PlanId } from "@/lib/plans";
import type { BillingCycleValue } from "./billing-utils";
import { saveTenantBillingPaymentAction } from "./actions";

type Props = {
  tenantId: string;
  currentTier: string;
  suggestedMonthlyAmounts: Record<PlanId, number>;
};

const BILLING_OPTIONS: { value: BillingCycleValue; label: string }[] = [
  { value: "MONTHLY", label: "Mensual" },
  { value: "ANNUAL", label: "Anual" },
];

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function TenantBillingForm({
  tenantId,
  currentTier,
  suggestedMonthlyAmounts,
}: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [planId, setPlanId] = useState<PlanId>(() => getEffectivePlanId(currentTier));
  const [billingCycle, setBillingCycle] = useState<BillingCycleValue>("MONTHLY");
  const [amountArs, setAmountArs] = useState(
    String(suggestedMonthlyAmounts[getEffectivePlanId(currentTier)]),
  );
  const [paidAt, setPaidAt] = useState(todayInputValue);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestedAmount = useMemo(() => {
    const monthly = suggestedMonthlyAmounts[planId];
    return billingCycle === "ANNUAL" ? monthly * 12 : monthly;
  }, [billingCycle, planId, suggestedMonthlyAmounts]);

  function syncSuggested(nextPlanId: PlanId, nextCycle: BillingCycleValue) {
    const monthly = suggestedMonthlyAmounts[nextPlanId];
    setAmountArs(String(nextCycle === "ANNUAL" ? monthly * 12 : monthly));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await saveTenantBillingPaymentAction(formData);
    setLoading(false);

    if ("error" in res) {
      showToast(res.error ?? "No se pudo guardar el pago.", "error");
      return;
    }

    showToast("Pago registrado.", "success");
    setNote("");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <input type="hidden" name="tenantId" value={tenantId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Plan cobrado
          <select
            name="planId"
            value={planId}
            onChange={(e) => {
              const nextPlanId = e.target.value as PlanId;
              setPlanId(nextPlanId);
              syncSuggested(nextPlanId, billingCycle);
            }}
            className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500 focus:ring-2"
          >
            {PLAN_IDS.map((id) => (
              <option key={id} value={id}>
                {PLANS[id].label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Modalidad
          <select
            name="billingCycle"
            value={billingCycle}
            onChange={(e) => {
              const nextCycle = e.target.value as BillingCycleValue;
              setBillingCycle(nextCycle);
              syncSuggested(planId, nextCycle);
            }}
            className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500 focus:ring-2"
          >
            {BILLING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Importe (ARS)
          <input
            type="number"
            name="amountArs"
            min={1}
            step={1}
            value={amountArs}
            onChange={(e) => setAmountArs(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500 focus:ring-2"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Sugerido: ${suggestedAmount.toLocaleString("es-AR")}
          </span>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Fecha de pago
          <input
            type="date"
            name="paidAt"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500 focus:ring-2"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Nota interna
        <textarea
          name="note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej: pagó por transferencia, pidió factura, renovó con promo..."
          className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-teal-500 focus:ring-2"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
      >
        {loading ? "Guardando…" : "Registrar pago"}
      </button>
    </form>
  );
}
