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
    <div className="space-y-8">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Horarios de atención
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          Definí la semana tipo de tu negocio (o de cada profesional). La grilla de abajo resume todo
          de un vistazo; tocá <strong className="font-semibold text-slate-800">Editar horarios</strong>{" "}
          para cambiar días y franjas — es el mismo flujo que en el alta inicial.
        </p>
      </header>

      <div className="space-y-6">
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
    </div>
  );
}
