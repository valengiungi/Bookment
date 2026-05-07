"use client";

import { useEffect, useRef, useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { updateTenantWhatsapp } from "@/app/dashboard/actions";

export function WhatsappEditPanel({
  initialWhatsapp,
}: {
  initialWhatsapp: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialWhatsapp ?? "");
  const prevInitial = useRef(initialWhatsapp);

  useEffect(() => {
    if (prevInitial.current !== initialWhatsapp) {
      prevInitial.current = initialWhatsapp;
      setDraft(initialWhatsapp ?? "");
      setEditing(false);
    }
  }, [initialWhatsapp]);

  const saved = (initialWhatsapp ?? "").trim();
  const hasNumber = saved.length > 0;

  if (!editing) {
    return (
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="break-all text-sm text-slate-800">
          {hasNumber ? (
            saved
          ) : (
            <span className="text-slate-500">Sin número configurado</span>
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            setDraft(initialWhatsapp ?? "");
            setEditing(true);
          }}
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <form
      action={updateTenantWhatsapp}
      className="mt-3 flex flex-col gap-3"
    >
      <input
        name="whatsapp"
        required
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Ej: +5491123456789"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        autoComplete="tel"
      />
      <div className="flex flex-wrap gap-2">
        <FormSubmitButton
          idleText="Guardar cambios"
          loadingText="Guardando…"
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
        />
        <button
          type="button"
          onClick={() => {
            setDraft(initialWhatsapp ?? "");
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
