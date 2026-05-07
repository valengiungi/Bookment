"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { useToast } from "@/components/toast";

export function SignOutPanel() {
  const { showToast } = useToast();
  const [step, setStep] = useState<0 | 1>(0);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (step === 0) {
    return (
      <div className="mt-3">
        <button
          type="button"
          onClick={() => {
            setStep(1);
            setConfirmed(false);
          }}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Cerrar sesión
        </button>
        <p className="mt-2 text-xs text-slate-500">
          Primer paso: al tocar el botón se abre la confirmación. No se cierra la sesión todavía.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
      <p className="text-sm text-amber-950">
        Vas a salir de tu cuenta en <strong>este navegador</strong>. Si tenés cambios sin guardar en
        otra pestaña, guardalos antes.
      </p>
      <label className="flex cursor-pointer items-start gap-2 text-sm text-amber-950">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 rounded border-amber-400"
        />
        <span>Confirmo que quiero cerrar la sesión ahora (segundo paso).</span>
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!confirmed || loading}
          onClick={() => {
            setLoading(true);
            void signOut({ callbackUrl: "/" }).catch(() => {
              showToast("No se pudo cerrar sesión. Probá de nuevo.", "error");
              setLoading(false);
            });
          }}
          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {loading ? "Cerrando…" : "Sí, cerrar sesión"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setStep(0);
            setConfirmed(false);
          }}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
