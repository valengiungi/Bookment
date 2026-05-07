"use client";

import { useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { deleteStaff, updateStaff } from "@/app/dashboard/actions";

export function StaffItemActions({
  staffId,
  name,
}: {
  staffId: string;
  name: string;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {editing ? "Cancelar" : "Editar"}
        </button>
        <form action={deleteStaff}>
          <input type="hidden" name="staffId" value={staffId} />
          <FormSubmitButton
            idleText="Ocultar"
            loadingText="Ocultando…"
            spinnerClassName="border-rose-200 border-t-rose-600"
            className="rounded-lg border border-amber-300 bg-amber-50/80 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          />
        </form>
      </div>

      {editing ? (
        <form
          action={updateStaff}
          onSubmit={() => setEditing(false)}
          className="flex w-full gap-2 sm:w-[320px]"
        >
          <input type="hidden" name="staffId" value={staffId} />
          <input
            name="name"
            defaultValue={name}
            required
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <FormSubmitButton
            idleText="Guardar"
            loadingText="Guardando…"
            className="rounded-lg bg-teal-600 px-3 py-2 text-xs text-white hover:bg-teal-700"
          />
        </form>
      ) : null}
    </div>
  );
}
