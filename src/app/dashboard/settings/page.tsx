import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createStaff } from "@/app/dashboard/actions";
import { StaffItemActions } from "./staff-item-actions";
import { InactiveStaffActions } from "./inactive-staff-actions";
import { LogoEditPanel } from "./logo-edit-panel";
import { WhatsappEditPanel } from "./whatsapp-edit-panel";
import { DeleteTenantPanel } from "./delete-tenant-panel";
import { AccountEmailPanel } from "./account-email-panel";
import { AccountPasswordPanel } from "./account-password-panel";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    staffPurge?: string;
    accountEmail?: string;
    accountPassword?: string;
    deleteTenant?: string;
  }>;
}) {
  const { staffPurge, accountEmail, accountPassword, deleteTenant } = await searchParams;
  const session = await auth();
  const tenantId = session?.user.tenantId;
  const userId = session?.user.id;
  if (!tenantId || !userId) return null;

  const [tenant, staff, user] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.staff.findMany({ where: { tenantId }, orderBy: { createdAt: "asc" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
  ]);

  if (!tenant || !user) return null;

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.AUTH_URL ?? "http://localhost:3000");

  const isOwner = session.user.role === "OWNER";

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-slate-900">Configuración</h1>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-medium text-slate-900">Link público</h2>
        <p className="mt-2 break-all text-sm text-teal-800">
          {origin.replace(/\/$/, "")}/{tenant.slug}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Compartilo con tus clientes para que reserven solos.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-medium text-slate-900">Logo público</h2>
        <p className="mt-2 text-xs text-slate-500">
          Se muestra en la página de reservas. En Vercel usá Blob (token en variables de entorno).
        </p>
        <LogoEditPanel initialLogoUrl={tenant.logoUrl} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-medium text-slate-900">WhatsApp negocio</h2>
        <p className="mt-2 text-xs text-slate-500">
          Se usa para avisarte cuando alguien reserva y para los enlaces de
          WhatsApp.
        </p>
        <WhatsappEditPanel initialWhatsapp={tenant.whatsapp} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-medium text-slate-900">Cuenta</h2>
        {accountEmail === "ok" ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Email actualizado correctamente.
          </p>
        ) : null}
        {accountEmail === "used" ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            Ese email ya está en uso.
          </p>
        ) : null}
        {accountEmail === "invalid" ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Ingresá un email válido.
          </p>
        ) : null}
        {accountPassword === "ok" ? (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Contraseña actualizada correctamente.
          </p>
        ) : null}
        {accountPassword === "wrongCurrent" ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            La contraseña actual no coincide.
          </p>
        ) : null}
        {accountPassword === "mismatch" ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Las nuevas contraseñas no coinciden.
          </p>
        ) : null}
        {accountPassword === "short" ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            La nueva contraseña debe tener al menos 8 caracteres.
          </p>
        ) : null}

        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="text-sm font-medium text-slate-800">Email de acceso</p>
          <AccountEmailPanel currentEmail={user.email} />
        </div>
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="text-sm font-medium text-slate-800">Contraseña</p>
          <AccountPasswordPanel />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="font-medium text-slate-900">Profesionales</h2>
        {staffPurge === "bookings" ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            No se puede borrar un profesional que ya tiene turnos en el historial. Los turnos
            quedan vinculados a esa persona.
          </p>
        ) : null}
        {staffPurge === "forbidden" ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            Solo podés eliminar por completo a profesionales que estén inactivos.
          </p>
        ) : null}
        <ul className="mt-3 divide-y divide-slate-100">
          {staff.map((s) => (
            <li key={s.id} className="flex flex-col gap-2 py-2 sm:flex-row sm:justify-between">
              <p className="text-sm text-slate-800">
                {s.name}{" "}
                <span
                  className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    s.active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {s.active ? "Activo" : "Inactivo"}
                </span>
              </p>
              {s.active ? (
                <StaffItemActions staffId={s.id} name={s.name} />
              ) : (
                <InactiveStaffActions staffId={s.id} name={s.name} />
              )}
            </li>
          ))}
        </ul>
        <form action={createStaff} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            name="name"
            required
            placeholder="Nombre del profesional"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Agregar
          </button>
        </form>
      </section>

      <section className="rounded-2xl border-2 border-rose-200 bg-white p-4">
        <h2 className="font-medium text-rose-900">Eliminar negocio</h2>
        <p className="mt-2 text-xs text-slate-600">
          Borra el negocio completo en la base de datos: turnos, clientes en historial, servicios,
          horarios y cuentas de acceso asociadas a este negocio.
        </p>
        {deleteTenant === "forbidden" ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            No tenés permiso para esta acción.
          </p>
        ) : null}
        {deleteTenant === "nameMismatch" ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            El nombre del negocio no coincide exactamente.
          </p>
        ) : null}
        {deleteTenant === "phrase" ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Tenés que escribir ELIMINAR en mayúsculas.
          </p>
        ) : null}
        {deleteTenant === "unchecked" ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Marcá la casilla de confirmación.
          </p>
        ) : null}
        {deleteTenant === "missing" ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            No encontramos el negocio. Probá recargar la página.
          </p>
        ) : null}
        <DeleteTenantPanel tenantName={tenant.name} disabled={!isOwner} />
      </section>
    </div>
  );
}
