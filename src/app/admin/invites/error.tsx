"use client";

import Link from "next/link";

export default function AdminInvitesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-950">
      <h1 className="text-lg font-semibold">Algo falló en Invitaciones</h1>
      <p className="mt-2">
        Suele pasar si la base no tiene la tabla de códigos. En tu máquina probá{" "}
        <code className="rounded bg-red-100 px-1">npx prisma db push</code> y{" "}
        <code className="rounded bg-red-100 px-1">npx prisma generate</code>.
      </p>
      {process.env.NODE_ENV === "development" ? (
        <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-white/80 p-2 text-xs text-slate-800">
          {error.message}
        </pre>
      ) : null}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-red-800 px-4 py-2 text-white hover:bg-red-900"
        >
          Reintentar
        </button>
        <Link href="/admin" className="rounded-xl border border-red-300 px-4 py-2 hover:bg-white/50">
          Volver al panel
        </Link>
      </div>
    </div>
  );
}
