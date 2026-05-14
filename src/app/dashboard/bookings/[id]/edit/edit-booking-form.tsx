"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { updateBookingFromDashboard } from "@/app/dashboard/actions";

export function EditBookingForm({
  bookingId,
  initialServiceId,
  initialStaffId,
  initialStartsLocal,
  services,
  staff,
  sameServicesAllStaff,
  staffIdsByService,
  staffLocked,
}: {
  bookingId: string;
  initialServiceId: string;
  initialStaffId: string;
  initialStartsLocal: string;
  services: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  sameServicesAllStaff: boolean;
  staffIdsByService: Record<string, string[]> | null;
  staffLocked: boolean;
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [staffId, setStaffId] = useState(initialStaffId);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const staffForService = useCallback(
    (svcId: string) => {
      if (sameServicesAllStaff || !staffIdsByService) return staff;
      const ids = new Set(staffIdsByService[svcId] ?? []);
      return staff.filter((s) => ids.has(s.id));
    },
    [sameServicesAllStaff, staff, staffIdsByService],
  );

  const staffOptions = staffForService(serviceId);

  function onServiceChange(next: string) {
    setServiceId(next);
    const nextStaff = staffForService(next);
    if (!nextStaff.some((s) => s.id === staffId)) {
      setStaffId(nextStaff[0]?.id ?? "");
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const r = await updateBookingFromDashboard(fd);
          if (r.ok) router.push(r.redirectTo);
          else setErr(r.message);
        });
      }}
      className="max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="bookingId" value={bookingId} />

      <div>
        <label htmlFor="edit-service" className="block text-sm font-medium text-slate-700">
          Servicio
        </label>
        <select
          id="edit-service"
          name="serviceId"
          value={serviceId}
          onChange={(e) => onServiceChange(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="edit-staff" className="block text-sm font-medium text-slate-700">
          Profesional
        </label>
        {staffLocked ? (
          <>
            <input type="hidden" name="staffId" value={staffId} />
            <input
              id="edit-staff"
              value={staffOptions[0]?.name ?? staff[0]?.name ?? ""}
              disabled
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 shadow-sm"
            />
          </>
        ) : (
          <select
            id="edit-staff"
            name="staffId"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label htmlFor="edit-starts" className="block text-sm font-medium text-slate-700">
          Fecha y hora
        </label>
        <input
          id="edit-starts"
          name="startsAt"
          type="datetime-local"
          defaultValue={initialStartsLocal}
          required
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      {err ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {err}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || staffOptions.length === 0}
        className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 sm:w-auto"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
