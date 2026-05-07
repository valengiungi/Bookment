"use client";

import { useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  deleteServicePermanently,
  toggleServiceActive,
  updateService,
} from "@/app/dashboard/actions";

export function ServiceItemActions(props: {
  serviceId: string;
  active: boolean;
  name: string;
  durationMinutes: number;
  priceCents: number | null;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mt-2 flex flex-col items-stretch gap-2 sm:mt-0 sm:items-end">
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            props.active
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          }`}
        >
          {props.active ? "Activo" : "Inactivo"}
        </span>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {editing ? "Cancelar edición" : "Editar"}
        </button>
        <form action={toggleServiceActive}>
          <input type="hidden" name="serviceId" value={props.serviceId} />
          <input type="hidden" name="active" value={props.active ? "false" : "true"} />
          <FormSubmitButton
            idleText={props.active ? "Ocultar" : "Mostrar"}
            loadingText="Guardando…"
            className={`rounded-lg px-3 py-1.5 text-xs ${
              props.active
                ? "border border-rose-200 text-rose-700 hover:bg-rose-50"
                : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            }`}
          />
        </form>
        <form action={deleteServicePermanently}>
          <input type="hidden" name="serviceId" value={props.serviceId} />
          <FormSubmitButton
            idleText="Eliminar"
            loadingText="Eliminando…"
            className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50"
          />
        </form>
      </div>

      {editing ? (
        <form
          action={updateService}
          onSubmit={() => setEditing(false)}
          className="grid w-full gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:w-[360px] sm:grid-cols-2"
        >
          <input type="hidden" name="serviceId" value={props.serviceId} />
          <label className="text-xs font-medium text-slate-700 sm:col-span-2">
            Nombre
            <input
              name="name"
              defaultValue={props.name}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-slate-700">
            Duración
            <input
              name="durationMinutes"
              type="number"
              min={5}
              defaultValue={props.durationMinutes}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-slate-700">
            Precio
            <input
              name="priceAmount"
              type="number"
              min={0}
              step="0.01"
              defaultValue={
                props.priceCents == null ? "" : (props.priceCents / 100).toFixed(2)
              }
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <FormSubmitButton
              idleText="Guardar cambios"
              loadingText="Guardando…"
              className="w-full bg-teal-600 py-2 text-xs text-white hover:bg-teal-700"
            />
          </div>
        </form>
      ) : null}
    </div>
  );
}
