import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TenantExpenseKind } from "@/generated/prisma";
import { createExpense, deleteExpense } from "@/app/dashboard/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { prisma } from "@/lib/prisma";

const sections: {
  kind: TenantExpenseKind;
  title: string;
  description: string;
}[] = [
  {
    kind: "FIXED_ONE_TIME",
    title: "Gastos fijos únicos",
    description: "Compras puntuales como sillas, espejos, máquinas o muebles.",
  },
  {
    kind: "FIXED_MONTHLY",
    title: "Gastos fijos mensuales",
    description: "Pagos que suelen repetirse todos los meses, como alquiler o servicios.",
  },
  {
    kind: "DYNAMIC",
    title: "Gastos dinámicos",
    description: "Consumos variables del día a día, como sprays, navajas o insumos.",
  },
];

function formatArs(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

function formatExpenseDate(value: Date) {
  return value.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams?: Promise<{ expenseMsg?: string }>;
}) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) {
    redirect("/login");
  }
  if (session.user.role === "EMPLOYEE") {
    redirect("/dashboard");
  }

  const sp = searchParams ? await searchParams : {};
  const expenses = await prisma.tenantExpense.findMany({
    where: { tenantId },
    orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
  });

  const feedback =
    sp.expenseMsg === "created"
      ? {
          className: "border-emerald-200 bg-emerald-50 text-emerald-900",
          text: "Gasto guardado correctamente.",
        }
      : sp.expenseMsg === "deleted"
        ? {
            className: "border-emerald-200 bg-emerald-50 text-emerald-900",
            text: "Gasto eliminado.",
          }
        : sp.expenseMsg === "invalid"
          ? {
              className: "border-amber-200 bg-amber-50 text-amber-900",
              text: "Revisá los datos del gasto antes de guardarlo.",
            }
          : null;

  const total = expenses.reduce((sum, item) => sum + item.amountArs, 0);
  const totalsByKind = Object.fromEntries(
    sections.map((section) => [
      section.kind,
      expenses
        .filter((item) => item.kind === section.kind)
        .reduce((sum, item) => sum + item.amountArs, 0),
    ]),
  ) as Record<TenantExpenseKind, number>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Gastos</h1>
        <p className="mt-1 text-sm text-slate-600">
          Registrá los egresos del negocio y separalos entre fijos únicos, fijos mensuales y
          dinámicos.
        </p>
      </div>

      {feedback ? (
        <p className={`rounded-xl border px-4 py-3 text-sm ${feedback.className}`}>
          {feedback.text}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total registrado</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatArs(total)}</p>
        </div>
        {sections.map((section) => (
          <div
            key={section.kind}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-500">{section.title}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatArs(totalsByKind[section.kind] ?? 0)}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Agregar gasto</h2>
        <p className="mt-1 text-sm text-slate-500">
          Cargá el nombre, el tipo, el importe y la fecha. La nota es opcional.
        </p>

        <form action={createExpense} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-slate-700">
            Nombre
            <input
              name="name"
              required
              placeholder="Ej. Alquiler, spray o silla nueva"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>

          <label className="block text-sm text-slate-700">
            Tipo de gasto
            <select
              name="kind"
              defaultValue="FIXED_MONTHLY"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="FIXED_ONE_TIME">Fijo único</option>
              <option value="FIXED_MONTHLY">Fijo mensual</option>
              <option value="DYNAMIC">Dinámico</option>
            </select>
          </label>

          <label className="block text-sm text-slate-700">
            Importe (ARS)
            <input
              name="amountArs"
              type="number"
              min="1"
              step="1"
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>

          <label className="block text-sm text-slate-700">
            Fecha
            <input
              name="expenseDate"
              type="date"
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>

          <label className="block text-sm text-slate-700 md:col-span-2">
            Nota opcional
            <textarea
              name="note"
              rows={3}
              placeholder="Ej. Pago correspondiente a mayo"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>

          <div className="md:col-span-2">
            <FormSubmitButton
              idleText="Guardar gasto"
              loadingText="Guardando…"
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
            />
          </div>
        </form>
      </section>

      <div className="space-y-5">
        {sections.map((section) => {
          const items = expenses.filter((expense) => expense.kind === section.kind);

          return (
            <section
              key={section.kind}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{section.description}</p>
                </div>
                <p className="text-sm font-medium text-slate-700">
                  Total: {formatArs(totalsByKind[section.kind] ?? 0)}
                </p>
              </div>

              {items.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Todavía no cargaste gastos en esta categoría.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {items.map((expense) => (
                    <li
                      key={expense.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{expense.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatExpenseDate(expense.expenseDate)} · {formatArs(expense.amountArs)}
                        </p>
                        {expense.note ? (
                          <p className="mt-1 text-sm text-slate-500">{expense.note}</p>
                        ) : null}
                      </div>

                      <form action={deleteExpense}>
                        <input type="hidden" name="expenseId" value={expense.id} />
                        <FormSubmitButton
                          idleText="Eliminar"
                          loadingText="Eliminando…"
                          spinnerClassName="border-rose-200 border-t-rose-600"
                          className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs text-rose-700 hover:bg-rose-50"
                        />
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
