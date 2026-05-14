"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { type AccountWhatsappFormState, updateAccountWhatsapp } from "@/app/dashboard/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

export function AccountWhatsappPanel({
  currentWhatsapp,
}: {
  currentWhatsapp: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentWhatsapp ?? "");
  const prev = useRef(currentWhatsapp);
  const [state, formAction] = useActionState<AccountWhatsappFormState, FormData>(
    updateAccountWhatsapp,
    {
      tone: "idle",
      text: null,
    },
  );

  useEffect(() => {
    if (prev.current !== currentWhatsapp) {
      prev.current = currentWhatsapp;
      setDraft(currentWhatsapp ?? "");
      setEditing(false);
    }
  }, [currentWhatsapp]);

  useEffect(() => {
    if (state.tone === "success") {
      const timer = window.setTimeout(() => setEditing(false), 0);
      return () => window.clearTimeout(timer);
    }
  }, [state.tone]);

  const feedbackClassName =
    state.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : state.tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900";

  if (!editing) {
    return (
      <div className="mt-3 flex flex-col gap-3">
        {state.text ? (
          <p className={`rounded-xl border px-3 py-2 text-sm ${feedbackClassName}`}>{state.text}</p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="break-all text-sm text-slate-800">
            {currentWhatsapp ? currentWhatsapp : <span className="text-slate-500">Sin número vinculado</span>}
          </p>
          <button
            type="button"
            onClick={() => {
              setDraft(currentWhatsapp ?? "");
              setEditing(true);
            }}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            {currentWhatsapp ? "Editar WhatsApp" : "Vincular WhatsApp"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-3">
      {state.text ? (
        <p className={`rounded-xl border px-3 py-2 text-sm ${feedbackClassName}`}>{state.text}</p>
      ) : null}
      <label className="block text-sm text-slate-700">
        Número de WhatsApp
        <input
          name="whatsappNumber"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ej: +5491123456789"
          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          autoComplete="tel"
        />
        <span className="mt-1 block text-xs text-slate-500">
          Usá formato internacional. Si lo dejás vacío, se desliga de tu cuenta.
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <FormSubmitButton
          idleText="Guardar WhatsApp"
          loadingText="Guardando…"
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
        />
        <button
          type="button"
          onClick={() => {
            setDraft(currentWhatsapp ?? "");
            setEditing(false);
          }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Cancelar edición
        </button>
      </div>
    </form>
  );
}
