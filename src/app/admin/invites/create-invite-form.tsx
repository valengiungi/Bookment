"use client";

import { useState } from "react";
import { LoadingButton } from "@/components/loading-button";
import { createSignupInviteAction } from "./actions";

export function CreateInviteForm({ emailConfigured }: { emailConfigured: boolean }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastPlain, setLastPlain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLastPlain(null);
    const res = await createSignupInviteAction(note.trim() || null);
    setLoading(false);
    if ("error" in res) {
      setError(res.error ?? "Error desconocido.");
      return;
    }
    setLastPlain(res.plainCode);
    setNote("");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Nuevo código</h2>
      <p className="mt-1 text-sm text-slate-600">
        Se genera un código aleatorio. Copiá y compartí el valor apenas aparece: no se vuelve a mostrar.
        {emailConfigured
          ? " También te lo enviamos por correo si tenés PLATFORM_OWNER_EMAIL en el servidor."
          : " Si configurás Resend (RESEND_API_KEY), el código también te llega por mail."}
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm font-medium text-slate-700">
          Nota (opcional)
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej. Peluquería Ana"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-base outline-none ring-teal-500 focus:ring-2"
          />
        </label>
        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Generando…"
          idleText="Generar código"
          className="shrink-0 bg-teal-600 text-white hover:bg-teal-700"
        />
      </form>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {lastPlain ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Código (guardalo ahora)</p>
          <p className="mt-2 break-all font-mono text-base tracking-wide">{lastPlain}</p>
        </div>
      ) : null}
    </div>
  );
}
