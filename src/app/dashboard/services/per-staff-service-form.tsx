"use client";

import { FormSubmitButton } from "@/components/form-submit-button";

type SaveAction = (formData: FormData) => Promise<void>;

export function PerStaffServiceForm({
  staffId,
  services,
  initialServiceIds,
  saveAction,
  showHeader = true,
  staffName,
  formClassName = "",
}: {
  staffId: string;
  staffName?: string;
  services: { id: string; name: string }[];
  initialServiceIds: string[];
  saveAction: SaveAction;
  /** Si es false, solo checkboxes + guardar (el título va afuera). */
  showHeader?: boolean;
  formClassName?: string;
}) {
  const selectionKey = [...initialServiceIds].sort().join("|");

  if (services.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No hay servicios activos en el catálogo. Agregá servicios arriba.
      </p>
    );
  }

  return (
    <form
      key={`${staffId}-${selectionKey}`}
      action={saveAction}
      className={formClassName}
    >
      <input type="hidden" name="staffId" value={staffId} />
      {showHeader && staffName ? (
        <h3 className="text-sm font-semibold text-slate-900">{staffName}</h3>
      ) : null}
      <ul
        className={`flex flex-col gap-2 sm:flex-row sm:flex-wrap ${showHeader ? "mt-3" : ""}`}
      >
        {services.map((svc) => {
          const checked = initialServiceIds.includes(svc.id);
          return (
            <li key={svc.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 hover:border-slate-300 hover:bg-white">
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
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <FormSubmitButton
          idleText="Guardar cambios"
          loadingText="Guardando…"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        />
      </div>
    </form>
  );
}
