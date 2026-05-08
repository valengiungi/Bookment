"use client";

import { useActionState, useEffect, useState } from "react";
import { updatePlatformPricingForm, type UpdatePlatformPricingState } from "./actions";
import { formatArs } from "@/lib/subscription-pricing";

type Props = {
  initialSimple: number;
  initialPremium: number;
};

export function EconomiaPricingForm({ initialSimple, initialPremium }: Props) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<UpdatePlatformPricingState | null, FormData>(
    async (_prev, formData) => updatePlatformPricingForm(formData),
    null,
  );

  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state?.ok]);

  if (!editing) {
    return (
      <div className="mt-4 space-y-4">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3">
            <dt className="text-xs font-medium text-slate-500">Simple (ARS / mes)</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
              {formatArs(initialSimple)}
            </dd>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3">
            <dt className="text-xs font-medium text-slate-500">Premium (ARS / mes)</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
              {formatArs(initialPremium)}
            </dd>
          </div>
        </dl>
        {state?.ok ? (
          <p className="text-sm text-emerald-700" role="status">
            Guardado.
          </p>
        ) : null}
        {state?.error ? (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Modificar precios
        </button>
      </div>
    );
  }

  return (
    <form
      key={`${initialSimple}-${initialPremium}-edit`}
      action={formAction}
      className="mt-4 space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="simpleArs" className="block text-xs font-medium text-slate-600">
            Simple (ARS / mes)
          </label>
          <input
            id="simpleArs"
            name="simpleArs"
            type="text"
            inputMode="numeric"
            defaultValue={String(initialSimple)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="premiumArs" className="block text-xs font-medium text-slate-600">
            Premium (ARS / mes)
          </label>
          <input
            id="premiumArs"
            name="premiumArs"
            type="text"
            inputMode="numeric"
            defaultValue={String(initialPremium)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            autoComplete="off"
          />
        </div>
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar precios"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setEditing(false)}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
