"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  deleteTenantFromAdminAction,
  type DeleteAdminTenantFormState,
} from "./actions";

const DELETE_WORD = "ELIMINAR";

export function TenantDeleteInlinePanel({
  tenantId,
  tenantName,
}: {
  tenantId: string;
  tenantName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nameOk, setNameOk] = useState(false);
  const [wordOk, setWordOk] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [state, formAction] = useActionState<DeleteAdminTenantFormState, FormData>(
    deleteTenantFromAdminAction,
    {
      tone: "idle",
      text: null,
    },
  );

  useEffect(() => {
    if (state.tone === "success") {
      const timer = window.setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [router, state.tone]);

  useEffect(() => {
    if (state.tone === "warning" || state.tone === "error") {
      const timer = window.setTimeout(() => setOpen(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, [state.tone]);

  const feedbackClassName =
    state.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : state.tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900";

  if (!open) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100"
        >
          Eliminar
        </button>
        <p className="text-[11px] text-slate-500">Paso 1: abrir confirmación</p>
      </div>
    );
  }

  const canSubmit = nameOk && wordOk && understood;

  return (
    <form
      action={formAction}
      className="mt-1 w-[22rem] max-w-[80vw] space-y-3 rounded-xl border-2 border-rose-300 bg-rose-50 p-3 text-left shadow-lg"
    >
      <input type="hidden" name="tenantId" value={tenantId} />
      {understood ? <input type="hidden" name="understood" value="yes" /> : null}

      <p className="text-sm font-semibold text-rose-950">
        Paso 2: confirmá el borrado permanente de <strong>{tenantName}</strong>.
      </p>
      <p className="text-xs text-rose-900/80">
        Se eliminan negocio, turnos, servicios, profesionales, gastos y usuarios vinculados. No se
        puede deshacer.
      </p>

      {state.text ? (
        <p className={`rounded-lg border px-3 py-2 text-xs ${feedbackClassName}`}>{state.text}</p>
      ) : null}

      <label className="block text-xs font-medium text-rose-950">
        Escribí exactamente el nombre del negocio
        <input
          name="confirmName"
          required
          autoComplete="off"
          placeholder={tenantName}
          onChange={(event) => setNameOk(event.target.value.trim() === tenantName.trim())}
          className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      </label>

      <label className="block text-xs font-medium text-rose-950">
        Escribí <span className="font-mono">{DELETE_WORD}</span> en mayúsculas
        <input
          name="confirmPhrase"
          required
          autoComplete="off"
          placeholder={DELETE_WORD}
          onChange={(event) => setWordOk(event.target.value.trim() === DELETE_WORD)}
          className="mt-1 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900"
        />
      </label>

      <label className="flex items-start gap-2 text-xs text-rose-950">
        <input
          type="checkbox"
          checked={understood}
          onChange={(event) => setUnderstood(event.target.checked)}
          className="mt-0.5 rounded border-rose-300"
        />
        <span>Entiendo que esta acción es permanente y borra todos los datos del negocio.</span>
      </label>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setNameOk(false);
            setWordOk(false);
            setUnderstood(false);
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <FormSubmitButton
          idleText="Borrar permanentemente"
          loadingText="Borrando…"
          disabled={!canSubmit}
          className="bg-rose-700 px-3 py-2 text-xs text-white hover:bg-rose-800 disabled:opacity-40"
          spinnerClassName="border-white/30 border-t-white"
        />
      </div>
    </form>
  );
}
