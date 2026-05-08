"use client";

import Link from "next/link";
import { useState } from "react";
import { LoadingButton } from "@/components/loading-button";
import { MarketingHeader } from "@/components/marketing-header";
import { useToast } from "@/components/toast";

export default function RegisterPage() {
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resentHint, setResentHint] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const { showToast } = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDevLink(null);
    const nameTrim = businessName.trim();
    const emailTrim = email.trim().toLowerCase();
    const passTrim = password;
    if (nameTrim.length < 2) {
      setError("El nombre del negocio es obligatorio (mínimo 2 caracteres).");
      showToast("Completá el nombre del negocio.", "error");
      return;
    }
    if (passTrim.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      showToast("La contraseña es muy corta.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: nameTrim,
          email: emailTrim,
          password: passTrim,
        }),
      });
      let data: {
        error?: string;
        needsVerification?: boolean;
        resent?: boolean;
        devVerificationLink?: string;
      } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        data = {};
      }
      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : `No se pudo registrar (${res.status}). ¿Tenés la base de datos corriendo y el .env bien?`;
        setError(msg);
        showToast(msg, "error");
        return;
      }
      if (data.needsVerification) {
        setDone(true);
        setResentHint(!!data.resent);
        if (typeof data.devVerificationLink === "string") {
          setDevLink(data.devVerificationLink);
        }
        showToast(
          data.resent ? "Te reenviamos el correo de verificación." : "Revisá tu correo para continuar.",
          "success",
        );
        return;
      }
      setError("Respuesta inesperada del servidor.");
      showToast("Algo salió mal.", "error");
    } catch {
      setError(
        "No hay conexión con el servidor. Asegurate de tener `npm run dev` corriendo y probá de nuevo.",
      );
      showToast("No hay conexión con el servidor.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Creá tu cuenta</h1>
        <p className="mt-2 text-sm text-slate-600">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-medium text-teal-700 hover:underline">
            Ingresá
          </Link>
        </p>

        {done ? (
          <div className="mt-8 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-sm text-emerald-950">
            <p className="font-medium">
              {resentHint
                ? "Ya había un registro pendiente con este email. Te enviamos de nuevo el enlace."
                : "Te enviamos un correo para verificar tu dirección."}
            </p>
            <p>
              Abrí el mail, tocá <strong>Verificar mi correo</strong> y después podés{" "}
              <Link href="/login" className="font-semibold text-teal-800 underline">
                ingresar
              </Link>
              . Sin verificar no se puede iniciar sesión.
            </p>
            <p className="text-xs text-emerald-900/80">
              ¿No llega? Revisá spam o{" "}
              <Link href="/resend-verification" className="font-semibold underline">
                pedí otro enlace
              </Link>
              .
            </p>
            {devLink ? (
              <p className="break-all rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                <span className="font-semibold">Modo desarrollo (sin Resend):</span>{" "}
                <a href={devLink} className="text-teal-800 underline">
                  {devLink}
                </a>
              </p>
            ) : null}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
            <label className="block text-sm font-medium text-slate-700">
              Nombre del negocio
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base outline-none ring-teal-500 focus:ring-2"
              />
            </label>
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
            <label className="block text-sm font-medium text-slate-700">
              Contraseña (mín. 8 caracteres)
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base outline-none ring-teal-500 focus:ring-2"
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Creando…"
              idleText="Continuar"
              className="mt-2 bg-teal-600 text-base text-white hover:bg-teal-700"
            />
          </form>
        )}
      </main>
    </div>
  );
}
