"use client";

import { useEffect, useRef, useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { updateAccountEmail } from "@/app/dashboard/actions";

export function AccountEmailPanel({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentEmail);
  const prev = useRef(currentEmail);

  useEffect(() => {
    if (prev.current !== currentEmail) {
      prev.current = currentEmail;
      setDraft(currentEmail);
      setEditing(false);
    }
  }, [currentEmail]);

  if (!editing) {
    return (
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="break-all text-sm text-slate-800">{currentEmail}</p>
        <button
          type="button"
          onClick={() => {
            setDraft(currentEmail);
            setEditing(true);
          }}
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Editar email
        </button>
      </div>
    );
  }

  return (
    <form action={updateAccountEmail} className="mt-3 flex flex-col gap-3">
      <input
        name="email"
        type="email"
        required
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        autoComplete="email"
      />
      <div className="flex flex-wrap gap-2">
        <FormSubmitButton
          idleText="Guardar email"
          loadingText="Guardando…"
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
        />
        <button
          type="button"
          onClick={() => {
            setDraft(currentEmail);
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
