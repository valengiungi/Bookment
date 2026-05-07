"use client";

import { useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { updateAccountPassword } from "@/app/dashboard/actions";

export function AccountPasswordPanel() {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="sr-only">Contraseña oculta</span>
          <p className="select-none text-sm tracking-widest text-slate-500" aria-hidden="true">
            ••••••••
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Editar contraseña
        </button>
      </div>
    );
  }

  return (
    <form action={updateAccountPassword} className="mt-3 space-y-3">
      <label className="block text-sm font-medium text-slate-800">
        Contraseña actual
        <input
          name="currentPassword"
          type="password"
          required
          minLength={8}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          autoComplete="current-password"
        />
      </label>
      <label className="block text-sm font-medium text-slate-800">
        Nueva contraseña
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          autoComplete="new-password"
        />
      </label>
      <label className="block text-sm font-medium text-slate-800">
        Repetir nueva contraseña
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          autoComplete="new-password"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <FormSubmitButton
          idleText="Guardar contraseña"
          loadingText="Guardando…"
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
        />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Cancelar edición
        </button>
      </div>
    </form>
  );
}
