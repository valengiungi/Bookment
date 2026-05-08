import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CreateInviteForm } from "./create-invite-form";
import { RevokeInviteButton } from "./revoke-invite-button";

export const dynamic = "force-dynamic";

type InviteRow = {
  id: string;
  note: string | null;
  usedAt: Date | null;
  createdAt: Date;
};

export default async function AdminInvitesPage() {
  let codes: InviteRow[] = [];
  let loadError: string | null = null;

  try {
    codes = await prisma.signupInviteCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        note: true,
        usedAt: true,
        createdAt: true,
      },
    });
  } catch (e) {
    console.error("[AdminInvitesPage]", e);
    const hint = e instanceof Error ? e.message : String(e);
    loadError = `No se pudieron cargar los códigos (${hint}). Si abrís el sitio en producción (Vercel), la base suele ser otra: ejecutá "npx prisma db push" usando la misma DATABASE_URL que Vercel, o el SQL en prisma/sql/signup_invite_code.sql en el SQL Editor de Supabase. Después reiniciá el servidor.`;
  }

  const unused = codes.filter((c) => !c.usedAt).length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">
          <Link href="/admin" className="text-teal-700 hover:underline">
            ← Panel
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Códigos de invitación</h1>
        <p className="mt-1 text-sm text-slate-600">
          Cada código permite crear <strong>una</strong> cuenta nueva. Los usados no se pueden reutilizar.
          Sin códigos libres, el registro público queda bloqueado.
        </p>
        <p className="mt-2 text-sm font-medium text-slate-800">Códigos sin usar: {unused}</p>
        {process.env.PLATFORM_OWNER_EMAIL?.trim() ? (
          <p className="mt-2 text-xs text-slate-500">
            Al generar un código, intentamos enviártelo a{" "}
            <span className="font-medium">{process.env.PLATFORM_OWNER_EMAIL}</span> si tenés{" "}
            <code className="rounded bg-slate-100 px-1">RESEND_API_KEY</code> configurado.
          </p>
        ) : null}
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {loadError}
        </div>
      ) : null}

      <CreateInviteForm emailConfigured={Boolean(process.env.RESEND_API_KEY?.trim())} />

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Historial</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2 font-medium">Creado</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Nota</th>
                <th className="w-32 px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {loadError ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Corregí el error de arriba y recargá la página.
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Todavía no hay códigos. Generá uno arriba.
                  </td>
                </tr>
              ) : (
                codes.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50">
                    <td className="px-4 py-2 text-slate-700">
                      {c.createdAt.toLocaleString("es-AR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {c.usedAt ? (
                        <span title={c.usedAt.toISOString()}>
                          Usado —{" "}
                          {c.usedAt.toLocaleString("es-AR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      ) : (
                        <span className="font-medium text-emerald-800">Libre</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-600">{c.note ?? "—"}</td>
                    <td className="px-4 py-2 text-right">
                      {!c.usedAt ? <RevokeInviteButton id={c.id} /> : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
