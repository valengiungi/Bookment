import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { HoursEditorCard } from "./hours-editor-card";

const dayLabels: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

export default async function HoursPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId!;

  const [staff, allHours] = await Promise.all([
    prisma.staff.findMany({
      where: { tenantId, active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    prisma.workingHour.findMany({
      where: { tenantId },
      orderBy: { dayOfWeek: "asc" },
    }),
  ]);

  const groups =
    staff.length > 0
      ? staff.map((s) => ({ id: s.id, name: s.name }))
      : [{ id: "__GENERAL__", name: "Horario general del negocio" }];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Horarios base</h1>
      <p className="text-sm text-slate-600">
        Vista simple de horarios. Tocá “Editar” para abrir el mismo menú del onboarding.
      </p>

      {groups.map((group) => {
        const staffId = group.id === "__GENERAL__" ? null : group.id;
        const rows = allHours
          .filter((h) => h.staffId === staffId)
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
        const openDays = rows.map((r) => r.dayOfWeek);
        const opensAt = rows[0]?.opensAt ?? "09:00";
        const closesAt = rows[0]?.closesAt ?? "18:00";
        const summary = rows.length
          ? `${rows
              .map((r) => `${dayLabels[r.dayOfWeek]} ${r.opensAt}-${r.closesAt}`)
              .join(" · ")}`
          : "Sin horarios cargados";

        return (
          <HoursEditorCard
            key={group.id}
            title={group.name}
            staffId={group.id}
            summary={summary}
            initialRows={rows.map((r) => ({
              dayOfWeek: r.dayOfWeek,
              opensAt: r.opensAt,
              closesAt: r.closesAt,
            }))}
            initialOpenDays={openDays}
            initialOpensAt={opensAt}
            initialClosesAt={closesAt}
          />
        );
      })}
    </div>
  );
}
