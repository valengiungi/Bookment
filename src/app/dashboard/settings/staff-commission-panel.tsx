"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type StaffCommissionFormState, updateStaffCommission } from "@/app/dashboard/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

export function StaffCommissionPanel({
  staffId,
  staffName,
  currentCommissionPercent,
}: {
  staffId: string;
  staffName: string;
  currentCommissionPercent: number;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useActionState<StaffCommissionFormState, FormData>(
    updateStaffCommission,
    {
      tone: "idle",
      text: null,
    },
  );

  const feedbackClassName =
    state.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : state.tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900";

  useEffect(() => {
    if (state.tone === "success") {
      const timer = window.setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [router, state.tone]);

  useEffect(() => {
    if (state.tone === "warning" || state.tone === "error") {
      const timer = window.setTimeout(() => setIsOpen(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, [state.tone]);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
    >
      <summary className="cursor-pointer list-none text-sm font-medium text-slate-800">
        Editar comisión
      </summary>

      <div className="mt-3 space-y-3">
        <p className="text-xs text-slate-500">
          Definí qué porcentaje del servicio se lleva {staffName}. El resto queda para el negocio.
        </p>

        {state.text ? (
          <p className={`rounded-xl border px-3 py-2 text-xs ${feedbackClassName}`} role="alert">
            {state.text}
          </p>
        ) : null}

        <form action={formAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="staffId" value={staffId} />

          <label className="block text-sm text-slate-700">
            Comisión (%)
            <input
              name="commissionPercent"
              type="number"
              min="0"
              max="100"
              step="1"
              required
              defaultValue={currentCommissionPercent}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>

          <div className="sm:self-end">
            <FormSubmitButton
              idleText="Guardar comisión"
              loadingText="Guardando…"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
            />
          </div>
        </form>
      </div>
    </details>
  );
}
