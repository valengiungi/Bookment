"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { LoadingButton } from "@/components/loading-button";
import { MarketingHeader } from "@/components/marketing-header";
import { useToast } from "@/components/toast";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const qpCallback = searchParams.get("callbackUrl");
  const authError = searchParams.get("error");
  const registered = searchParams.get("registered");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const safeCallback =
    qpCallback?.startsWith("/") && !qpCallback.startsWith("//") ? qpCallback : "/dashboard";

  useEffect(() => {
    if (registered === "1") {
      showToast("Cuenta creada. Ingresá con tu email y contraseña.", "success");
    }
    if (authError === "CredentialsSignin") {
      setError("Email o contraseña incorrectos.");
      showToast("Email o contraseña incorrectos.", "error");
    }
  }, [authError, registered, showToast]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
      callbackUrl: safeCallback,
    });

    setLoading(false);

    if (!res?.ok || res.error) {
      setError("Email o contraseña incorrectos.");
      showToast("Email o contraseña incorrectos.", "error");
      return;
    }

    showToast("Ingreso exitoso", "success");
    const session = await getSession();
    const nextHref =
      session?.user?.role === "OWNER" && !session.user.tenantId ? "/onboarding" : safeCallback;
    window.location.assign(nextHref);
  }

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Ingresar</h1>
        <p className="mt-2 text-sm text-slate-600">
          ¿Todavía no tenés cuenta?{" "}
          <Link href="/register" className="font-medium text-teal-700 hover:underline">
            Creá una
          </Link>{" "}
          (necesitás código de invitación).
        </p>
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
          <label className="block text-sm font-medium text-slate-700">
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base outline-none ring-teal-500 focus:ring-2"
            />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <LoadingButton
            type="submit"
            loading={loading}
            loadingText="Ingresando…"
            idleText="Ingresar"
            className="mt-2 bg-teal-600 text-base text-white hover:bg-teal-700"
          />
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/forgot-password" className="text-teal-700 hover:underline">
            Olvidé mi contraseña
          </Link>
        </p>
      </main>
    </div>
  );
}
