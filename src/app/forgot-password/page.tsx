"use client";

import Link from "next/link";
import { useState } from "react";
import { LoadingButton } from "@/components/loading-button";
import { MarketingHeader } from "@/components/marketing-header";
import { useToast } from "@/components/toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setDevLink(null);
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMessage("No pudimos procesar el pedido.");
      showToast("No pudimos procesar el pedido.", "error");
      return;
    }
    setMessage(
      "Si el email existe, te enviamos instrucciones. Revisá también spam.",
    );
    showToast("Si existe, enviamos el enlace.", "success");
    if (typeof data.devResetLink === "string") {
      setDevLink(data.devResetLink);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-slate-600">
          <Link href="/login" className="text-teal-700 hover:underline">
            Volver al login
          </Link>
        </p>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
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
            className="bg-teal-600 text-base text-white hover:bg-teal-700"
          />
        </form>
        {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
        {devLink ? (
          <p className="mt-2 break-all text-xs text-amber-800">
            Modo desarrollo:{" "}
            <a href={devLink} className="underline">
              {devLink}
            </a>
          </p>
        ) : null}
      </main>
    </div>
  );
}
