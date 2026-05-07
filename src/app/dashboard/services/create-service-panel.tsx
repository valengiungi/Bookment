"use client";

import { useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { createService } from "@/app/dashboard/actions";

export function CreateServicePanel() {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Agregar servicio
        </button>
      ) : (
        <form
          action={createService}
          className="grid gap-3 sm:grid-cols-2"
        >
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Nombre
            <input
              name="name"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Duración (min)
            <input
              name="durationMinutes"
              type="number"
              min={5}
              defaultValue={30}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Precio (opcional)
            <input
              name="priceAmount"
              type="number"
              min={0}
              step="0.01"
              placeholder="Ej: 12000"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <div className="sm:col-span-2 flex gap-2">
            <FormSubmitButton
              idleText="Guardar servicio"
              loadingText="Guardando…"
              className="bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
