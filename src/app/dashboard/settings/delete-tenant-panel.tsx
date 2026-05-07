"use client";

import { useState } from "react";
import { deleteTenantPermanently } from "@/app/dashboard/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

const DELETE_WORD = "ELIMINAR";

export function DeleteTenantPanel({
  tenantName,
  disabled,
}: {
  tenantName: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [nameOk, setNameOk] = useState(false);
  const [wordOk, setWordOk] = useState(false);
  const [understood, setUnderstood] = useState(false);

  if (disabled) {
    return (
      <p className="mt-3 text-xs text-slate-500">
        Solo el titular del negocio puede borrarlo por completo.
      </p>
    );
  }

  if (!open) {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"
        >
          Eliminar barbería / negocio para siempre
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Primer paso: abre la zona de confirmación. Todavía no se borra nada.
        </p>
      </div>
    );
  }

  const canSubmit = nameOk && wordOk && understood;

  return (
    <form action={deleteTenantPermanently} className="mt-4 space-y-4 rounded-xl border-2 border-rose-400 bg-rose-50 p-4">
      <p className="text-sm font-medium text-rose-950">
        Zona peligrosa: se borra el negocio, turnos, servicios, profesionales y todas las cuentas
        vinculadas (incluida la tuya). No se puede deshacer.
      </p>

      <label className="block text-sm text-rose-950">
        <span className="font-medium">
          Escribí exactamente el nombre del negocio: <strong>{tenantName}</strong>
        </span>
        <input
          name="confirmName"
          required
          autoComplete="off"
          className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900"
          placeholder={tenantName}
          onChange={(e) => setNameOk(e.target.value.trim() === tenantName.trim())}
        />
      </label>

      <label className="block text-sm text-rose-950">
        <span className="font-medium">
          Escribí <strong className="font-mono">{DELETE_WORD}</strong> en mayúsculas
        </span>
        <input
          name="confirmPhrase"
          required
          autoComplete="off"
          className="mt-1 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900"
          placeholder={DELETE_WORD}
          onChange={(e) => setWordOk(e.target.value.trim() === DELETE_WORD)}
        />
      </label>

      <label className="flex cursor-pointer items-start gap-2 text-sm text-rose-950">
        <input
          type="checkbox"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
          className="mt-1 rounded border-rose-400"
        />
        <span>Entiendo que esta acción es permanente y que pierdo todos los datos del negocio.</span>
      </label>
      {understood ? <input type="hidden" name="understood" value="yes" /> : null}

      <div className="flex flex-wrap gap-2">
        <FormSubmitButton
          idleText="Sí, borrar todo permanentemente"
          loadingText="Borrando…"
          disabled={!canSubmit}
          className="bg-rose-700 px-4 py-2 text-sm text-white hover:bg-rose-800 disabled:opacity-40"
          spinnerClassName="border-white/30 border-t-white"
        />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setNameOk(false);
            setWordOk(false);
            setUnderstood(false);
          }}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
      <p className="text-xs text-rose-900/80">
        Segundo paso: el botón rojo solo funciona si los textos coinciden y marcás la casilla.
      </p>
    </form>
  );
}
