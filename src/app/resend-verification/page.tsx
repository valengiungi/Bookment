"use client";

import Link from "next/link";
import { useState } from "react";
import { LoadingButton } from "@/components/loading-button";
import { MarketingHeader } from "@/components/marketing-header";
import { useToast } from "@/components/toast";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const { showToast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setDevLink(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        devVerificationLink?: string;
      };
      if (!res.ok) {
        showToast(typeof data.error === "string" ? data.error : "No se pudo enviar.", "error");
        setLoading(false);
        return;
      }
      setDone(true);
      if (typeof data.devVerificationLink === "string") {
        setDevLink(data.devVerificationLink);
      }
      showToast("Si el email está pendiente de verificación, te enviamos el enlace.", "success");
    } catch {
      showToast("Error de red.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Reenviar verificación</h1>
        <p className="mt-2 text-sm text-slate-600">
          <Link href="/login" className="font-medium text-teal-700 hover:underline">
            Volver a ingresar
          </Link>
        </p>

        {done ? (
          <div className="mt-8 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
            <p>
              Si existe una cuenta sin verificar con ese correo, te enviamos un nuevo enlace. Revisá
              también la carpeta de spam.
            </p>
            {devLink ? (
              <p className="break-all rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                <span className="font-semibold">Dev (sin Resend):</span>{" "}
                <a href={devLink} className="text-teal-800 underline">
                  {devLink}
                </a>
              </p>
            ) : null}
          </div>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)} className="mt-8 flex flex-col gap-4">
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base outline-none ring-teal-500 focus:ring-2"
              />
            </label>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Enviando…"
              idleText="Enviar enlace"
              className="bg-teal-600 text-white hover:bg-teal-700"
            />
          </form>
        )}
      </main>
    </div>
  );
}
