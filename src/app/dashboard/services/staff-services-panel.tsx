import { FormSubmitButton } from "@/components/form-submit-button";
import { setServicesAssignmentMode, updateStaffServiceAssignments } from "@/app/dashboard/actions";
import { PerStaffServiceForm } from "./per-staff-service-form";

export function StaffServicesPanel({
  sameServicesAllStaff,
  staff,
  services,
  selectedByStaffId,
}: {
  sameServicesAllStaff: boolean;
  staff: { id: string; name: string }[];
  services: { id: string; name: string }[];
  selectedByStaffId: Record<string, string[]>;
}) {
  if (staff.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
        Agregá al menos un profesional en <strong className="text-slate-800">Ajustes</strong> para
        poder definir servicios por persona.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-900">¿Quién ofrece cada servicio?</h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        Como en <strong className="font-medium text-slate-800">Horarios</strong>: podés usar los
        mismos servicios para todos los profesionales o marcar combinaciones distintas por persona.
        La página pública solo muestra los servicios que cada uno atiende.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <form action={setServicesAssignmentMode}>
          <input type="hidden" name="sameServicesAllStaff" value="true" />
          <FormSubmitButton
            idleText="Mismos servicios para todos"
            loadingText="Guardando…"
            className={`w-full rounded-xl border px-4 py-2.5 text-sm font-semibold sm:w-auto ${
              sameServicesAllStaff
                ? "border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500/30"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          />
        </form>
        <form action={setServicesAssignmentMode}>
          <input type="hidden" name="sameServicesAllStaff" value="false" />
          <FormSubmitButton
            idleText="Servicios distintos por profesional"
            loadingText="Guardando…"
            className={`w-full rounded-xl border px-4 py-2.5 text-sm font-semibold sm:w-auto ${
              !sameServicesAllStaff
                ? "border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500/30"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          />
        </form>
      </div>

      {!sameServicesAllStaff ? (
        <div className="mt-6 space-y-5 border-t border-slate-100 pt-5">
          <p className="text-xs text-slate-500">
            Marcá qué servicios ofrece cada profesional y guardá por persona. Al activar este modo,
            arrancamos con todos los servicios activos en todos; después podés ajustar.
          </p>
          {staff.map((s) => (
            <PerStaffServiceForm
              key={s.id}
              staffId={s.id}
              staffName={s.name}
              services={services}
              initialServiceIds={selectedByStaffId[s.id] ?? []}
              saveAction={updateStaffServiceAssignments}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
