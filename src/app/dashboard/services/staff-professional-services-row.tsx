"use client";

import { useState } from "react";
import { PerStaffServiceForm } from "./per-staff-service-form";
import type { updateStaffServiceAssignments } from "@/app/dashboard/actions";

type SaveAction = typeof updateStaffServiceAssignments;

export function StaffProfessionalServicesRow({
  staffId,
  staffName,
  services,
  assignedServiceIds,
  saveAction,
}: {
  staffId: string;
  staffName: string;
  services: { id: string; name: string }[];
  assignedServiceIds: string[];
  saveAction: SaveAction;
}) {
  const [editing, setEditing] = useState(false);

  const assignedServices = services.filter((s) => assignedServiceIds.includes(s.id));

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Profesional
          </p>
          <h3 className="text-base font-semibold text-slate-900">{staffName}</h3>
          {!editing ? (
            <div className="pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Servicios
              </p>
              {services.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  Todavía no hay servicios en el catálogo.
                </p>
              ) : assignedServices.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {assignedServices.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800"
                    >
                      {s.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Sin servicios asignados. Los clientes no verán turnos para este profesional hasta
                  que asignes al menos uno.
                </p>
              )}
            </div>
          ) : null}
        </div>

        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={services.length === 0}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Editar servicios
          </button>
        ) : null}
      </div>

      {editing && services.length > 0 ? (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <p className="text-sm text-slate-600">
            Marcá los servicios que atiende <strong className="font-medium text-slate-900">{staffName}</strong>{" "}
            en la página pública.
          </p>
          <div className="mt-4">
            <PerStaffServiceForm
              staffId={staffId}
              services={services}
              initialServiceIds={assignedServiceIds}
              saveAction={saveAction}
              showHeader={false}
            />
          </div>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="mt-3 text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
          >
            Cancelar
          </button>
        </div>
      ) : null}
    </article>
  );
}
