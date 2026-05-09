"use client";

import Link from "next/link";
import { useState } from "react";
import { LoadingButton } from "@/components/loading-button";
import { MarketingHeader } from "@/components/marketing-header";
import { useToast } from "@/components/toast";

const STEPS = 4;
const INVITE_CONTACT_PHONE = "+54 223 5049768";
const INVITE_CONTACT_WA = INVITE_CONTACT_PHONE.replace(/\D/g, "");
const INVITE_CONTACT_MESSAGE =
  "Hola! Estoy interesado en formar parte de Bookment y quisiera solicitar un código de invitación. También me gustaría recibir información sobre planes y precios disponibles. Muchas gracias.";

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { showToast } = useToast();

  function emailLooksValid(value: string) {
    const s = value.trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  function goNext(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (step === 0) {
      const nameTrim = businessName.trim();
      if (nameTrim.length < 2) {
        setError("El nombre del negocio es obligatorio (mínimo 2 caracteres).");
        showToast("Completá el nombre del negocio.", "error");
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      const emailTrim = email.trim().toLowerCase();
      if (!emailLooksValid(emailTrim)) {
        setError("Ingresá un email válido (ej. nombre@servicio.com).");
        showToast("Revisá el email.", "error");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (password.length < 8) {
        setError("La contraseña debe tener al menos 8 caracteres.");
        showToast("La contraseña es muy corta.", "error");
        return;
      }
      setStep(3);
    }
  }

  async function onFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const codeTrim = inviteCode.trim();
    if (!codeTrim) {
      setError("El código de invitación es obligatorio.");
      showToast("Ingresá el código que te pasó el administrador.", "error");
      return;
    }

    const nameTrim = businessName.trim();
    const emailTrim = email.trim().toLowerCase();
    if (nameTrim.length < 2 || !emailLooksValid(emailTrim) || password.length < 8) {
      setStep(0);
      setError("Volvé a completar los pasos anteriores.");
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
          password,
          inviteCode: codeTrim,
        }),
      });
      let data: { error?: string; ok?: boolean } = {};
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
      if (data.ok) {
        setDone(true);
        showToast("Cuenta creada. Ya podés ingresar.", "success");
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
            <p className="font-medium">Listo — tu cuenta y tu negocio ya están creados.</p>
            <p>
              Podés{" "}
              <Link href="/login" className="font-semibold text-teal-800 underline">
                ingresar con tu email y contraseña
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
              Paso {step + 1} de {STEPS}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-teal-600 transition-[width] duration-200"
                style={{ width: `${((step + 1) / STEPS) * 100}%` }}
              />
            </div>

            {step < 3 ? (
              <form onSubmit={goNext} className="mt-8 flex flex-col gap-4">
                {step === 0 ? (
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
                ) : null}
                {step === 1 ? (
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
                ) : null}
                {step === 2 ? (
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
                ) : null}

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setStep((s) => s - 1);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Atrás
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="submit"
                    className="rounded-xl bg-teal-600 px-4 py-3 text-base font-medium text-white hover:bg-teal-700 sm:min-w-[140px]"
                  >
                    Siguiente
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={(e) => void onFinalSubmit(e)} className="mt-8 flex flex-col gap-4">
                <p className="text-sm text-slate-600">
                  Por último, ingresá el <strong>código de invitación</strong> que te compartió quien te
                  dio de alta en Bookment (o el que recibió por correo el administrador).
                </p>
                <p className="text-sm leading-relaxed text-slate-600">
                  Si no tenés código, podés pedirlo al administrador de la aplicación. Contacto:{" "}
                  <a
                    href={`https://wa.me/${INVITE_CONTACT_WA}?text=${encodeURIComponent(INVITE_CONTACT_MESSAGE)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-teal-700 hover:underline"
                  >
                    {INVITE_CONTACT_PHONE}
                  </a>
                  .
                </p>
                <label className="block text-sm font-medium text-slate-700">
                  Código de invitación
                  <input
                    type="text"
                    autoComplete="off"
                    required
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Pegá el código aquí"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base outline-none ring-teal-500 focus:ring-2"
                  />
                </label>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep(2);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Atrás
                  </button>
                  <LoadingButton
                    type="submit"
                    loading={loading}
                    loadingText="Creando…"
                    idleText="Crear cuenta"
                    className="bg-teal-600 text-base text-white hover:bg-teal-700 sm:min-w-[140px]"
                  />
                </div>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}
