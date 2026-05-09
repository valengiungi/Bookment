"use client";

import { FormSubmitButton } from "@/components/form-submit-button";

type SaveAction = (formData: FormData) => Promise<void>;

export function PerStaffServiceForm({
  staffId,
  staffName,
  services,
  initialServiceIds,
  saveAction,
}: {
  staffId: string;
  staffName: string;
  services: { id: string; name: string }[];
  initialServiceIds: string[];
  saveAction: SaveAction;
}) {
  const selectionKey = [...initialServiceIds].sort().join("|");

  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">{staffName}</h3>
        <p className="mt-2 text-xs text-slate-500">No hay servicios activos todavía.</p>
      </div>
    );
  }

  return (
    <form
      key={`${staffId}-${selectionKey}`}
      action={saveAction}
      className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
    >
      <input type="hidden" name="staffId" value={staffId} />
      <h3 className="text-sm font-semibold text-slate-900">{staffName}</h3>
      <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {services.map((svc) => {
          const checked = initialServiceIds.includes(svc.id);
          return (
            <li key={svc.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 hover:bg-slate-50">
                <input
                  type="checkbox"
                  name="serviceId"
                  value={svc.id}
                  defaultChecked={checked}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                {svc.name}
              </label>
            </li>
          );
        })}
      </ul>
      <FormSubmitButton
        idleText="Guardar servicios de este profesional"
        loadingText="Guardando…"
        className="mt-3 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700"
      />
    </form>
  );
}
