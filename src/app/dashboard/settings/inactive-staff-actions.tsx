"use client";

import { useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { permanentlyDeleteStaff, reactivateStaff } from "@/app/dashboard/actions";

export function InactiveStaffActions({ staffId, name }: { staffId: string; name: string }) {
  const [confirmPurge, setConfirmPurge] = useState(false);

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
      <div className="flex flex-wrap justify-end gap-2">
        <form action={reactivateStaff}>
          <input type="hidden" name="staffId" value={staffId} />
          <FormSubmitButton
            idleText="Mostrar"
            loadingText="…"
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
          />
        </form>
        {!confirmPurge ? (
          <button
            type="button"
            onClick={() => setConfirmPurge(true)}
            className="rounded-lg border border-rose-400 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
          >
            Eliminar definitivamente
          </button>
        ) : null}
      </div>

      {confirmPurge ? (
        <div className="max-w-sm rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-right shadow-sm sm:max-w-xs">
          <p className="text-left text-xs text-rose-900">
            ¿Borrar a <span className="font-semibold">{name}</span> para siempre? No se puede
            deshacer. Solo se permite si no tiene turnos guardados.
          </p>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <form action={permanentlyDeleteStaff}>
              <input type="hidden" name="staffId" value={staffId} />
              <FormSubmitButton
                idleText="Sí, borrar"
                loadingText="Borrando…"
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              />
            </form>
            <button
              type="button"
              onClick={() => setConfirmPurge(false)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
