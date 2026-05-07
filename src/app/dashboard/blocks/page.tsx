import { formatInTimeZone } from "date-fns-tz";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createBlock, updateBlock } from "@/app/dashboard/actions";
import { defaultTimeZone } from "@/lib/timezone";
import { DeleteBlockButton } from "./delete-block-button";

export default async function BlocksPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId!;
  const tz = defaultTimeZone;

  const [blocks, staff] = await Promise.all([
    prisma.blockedSlot.findMany({
      where: { tenantId },
      include: { staff: true },
      orderBy: { startsAt: "desc" },
      take: 60,
    }),
    prisma.staff.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
  ]);

  const reasonLabel: Record<string, string> = {
    MANUAL: "Manual",
    VACATION: "Vacaciones",
    HOLIDAY: "Feriado",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Bloqueos y feriados</h1>
        <p className="mt-1 text-sm text-slate-600">
          Vacaciones, feriados o franjas manuales. Afectan la disponibilidad pública.
        </p>
      </div>

      <form
        action={createBlock}
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2"
      >
        <label className="text-sm font-medium text-slate-700">
          Desde
          <input
            name="startsAt"
            type="datetime-local"
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Hasta
          <input
            name="endsAt"
            type="datetime-local"
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Motivo
          <select name="reason" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
            <option value="MANUAL">Manual</option>
            <option value="VACATION">Vacaciones</option>
            <option value="HOLIDAY">Feriado</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Profesional (vacío = todo el negocio)
          <select name="staffId" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
            <option value="">Todos</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="sm:col-span-2 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white"
        >
          Guardar bloqueo
        </button>
      </form>

      <ul className="space-y-3">
        {blocks.map((b) => (
          <li
            key={b.id}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">
                  {formatInTimeZone(b.startsAt, tz, "yyyy-MM-dd HH:mm")} →{" "}
                  {formatInTimeZone(b.endsAt, tz, "yyyy-MM-dd HH:mm")}
                </p>
                <p className="mt-0.5 text-slate-600">
                  {reasonLabel[b.reason] ?? b.reason} ·{" "}
                  {b.staff ? b.staff.name : "Todo el negocio"}
                </p>
              </div>
              <DeleteBlockButton blockId={b.id} />
            </div>

            <details className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 open:bg-white open:shadow-sm">
              <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50/80 [&::-webkit-details-marker]:hidden">
                <span className="select-none">Editar bloqueo</span>
              </summary>
              <form
                action={updateBlock}
                className="grid gap-3 border-t border-slate-100 p-3 sm:grid-cols-2"
              >
                <input type="hidden" name="blockId" value={b.id} />
                <label className="text-sm font-medium text-slate-700">
                  Desde
                  <input
                    name="startsAt"
                    type="datetime-local"
                    required
                    defaultValue={formatInTimeZone(b.startsAt, tz, "yyyy-MM-dd'T'HH:mm")}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Hasta
                  <input
                    name="endsAt"
                    type="datetime-local"
                    required
                    defaultValue={formatInTimeZone(b.endsAt, tz, "yyyy-MM-dd'T'HH:mm")}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Motivo
                  <select
                    name="reason"
                    defaultValue={b.reason}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="MANUAL">Manual</option>
                    <option value="VACATION">Vacaciones</option>
                    <option value="HOLIDAY">Feriado</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Profesional (vacío = todo el negocio)
                  <select
                    name="staffId"
                    defaultValue={b.staffId ?? ""}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="">Todos</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="sm:col-span-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Guardar cambios
                </button>
              </form>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
