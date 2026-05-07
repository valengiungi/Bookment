"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { LoadingButton } from "@/components/loading-button";
import { MarketingHeader } from "@/components/marketing-header";
import { TimeSelect } from "@/components/time-select";
import { useToast } from "@/components/toast";

const days = [
  { id: 1, label: "Lun" },
  { id: 2, label: "Mar" },
  { id: 3, label: "Mié" },
  { id: 4, label: "Jue" },
  { id: 5, label: "Vie" },
  { id: 6, label: "Sáb" },
  { id: 0, label: "Dom" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const [businessType, setBusinessType] = useState("");
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [openDays, setOpenDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [opensAt, setOpensAt] = useState("09:00");
  const [closesAt, setClosesAt] = useState("18:00");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [whatsappCountry, setWhatsappCountry] = useState<CountryCode>("AR");
  const [whatsappLocal, setWhatsappLocal] = useState("");
  const [location, setLocation] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const regionNames = new Intl.DisplayNames(["es"], { type: "region" });
  const countries = getCountries()
    .map((iso) => {
      const name = regionNames.of(iso) ?? iso;
      const callingCode = getCountryCallingCode(iso);
      const flag = iso
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(127397 + char.charCodeAt(0)),
        );
      return { iso, name, callingCode, flag };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  function displayStep(s: number) {
    if (s <= 4) return s;
    if (s === 6) return 5;
    if (s === 8) return 6;
    return 7;
  }

  async function postStep(body: unknown) {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = typeof data.error === "string" ? data.error : "Error al guardar";
      setError(msg);
      showToast(msg, "error");
      return false;
    }
    setSaved(true);
    showToast("Guardado con exito", "success");
    setTimeout(() => setSaved(false), 800);
    return true;
  }

  async function uploadLogo() {
    if (!logoFile) return logoUrl || null;
    const form = new FormData();
    form.append("file", logoFile);
    const res = await fetch("/api/uploads/logo", {
      method: "POST",
      body: form,
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      url?: string;
    };
    if (!res.ok || typeof data.url !== "string") {
      const msg =
        typeof data.error === "string" ? data.error : "No se pudo subir el logo.";
      setError(msg);
      showToast(msg, "error");
      return null;
    }
    setLogoUrl(data.url);
    return data.url;
  }

  async function nextFrom(stepNo: number) {
    if (stepNo === 1) {
      if (!(await postStep({ step: 1, businessType }))) return;
    }
    if (stepNo === 2) {
      if (!(await postStep({ step: 2, name }))) return;
    }
    if (stepNo === 3) {
      const uploaded = await uploadLogo();
      if (uploaded === null && logoFile) return;
      if (!(await postStep({ step: 3, logoUrl: uploaded || logoUrl || null }))) return;
    }
    if (stepNo === 4) {
      const hours = openDays.map((dayOfWeek) => ({
        dayOfWeek,
        opensAt,
        closesAt,
      }));
      if (!(await postStep({ step: 4, hours }))) return;
      // Crear servicio inicial por defecto sin preguntar "primer servicio"
      if (!(await postStep({ step: 5, serviceName: "Turno general" }))) return;
      setStep(6);
      return;
    }
    if (stepNo === 6) {
      if (!(await postStep({ step: 6, durationMinutes }))) return;
      setStep(8);
      return;
    }
    if (stepNo === 8) {
      const digits = whatsappLocal.replace(/\D/g, "");
      if (digits.length < 6) {
        const msg = "El número es muy corto. Escribí tu número local sin espacios.";
        setError(msg);
        showToast(msg, "error");
        return;
      }
      const dial = getCountryCallingCode(whatsappCountry);
      const parsed = parsePhoneNumberFromString(
        `+${dial}${digits}`,
        whatsappCountry,
      );
      if (!parsed || !parsed.isValid()) {
        const msg =
          "Revisá el número. Elegí país correcto y escribí solo tu número local (sin 0 inicial, sin +, sin espacios).";
        setError(msg);
        showToast(msg, "error");
        return;
      }
      if (!(await postStep({ step: 8, whatsapp: parsed.number }))) return;
    }
    if (stepNo === 9) {
      if (!(await postStep({ step: 9, location: location || null }))) return;
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setStep((s) => s + 1);
  }

  function toggleDay(id: number) {
    setOpenDays((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  }

  function onLogoChange(file: File | null) {
    setLogoFile(file);
    if (!file) {
      setLogoPreview("");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
  }

  function clearLogoSelection() {
    setLogoFile(null);
    setLogoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  return (
    <div className="flex min-h-full flex-col">
      <MarketingHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <p className="text-sm font-medium text-teal-700">
          Configuración inicial — paso {displayStep(step)} de 7
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Tu negocio</h1>
        {saved ? (
          <p className="mt-2 text-sm font-medium text-teal-700">Guardado con exito.</p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        {step === 1 ? (
          <form
            className="mt-8 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void nextFrom(1);
            }}
          >
            <label className="text-sm font-medium text-slate-700">
              Tipo de negocio
              <input
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="Ej: consultorio, estudio, centro"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-base"
              />
            </label>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Guardando…"
              idleText="Siguiente"
              disabled={businessType.length < 2}
              className="bg-teal-600 text-white hover:bg-teal-700"
            />
          </form>
        ) : null}

        {step === 2 ? (
          <form
            className="mt-8 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void nextFrom(2);
            }}
          >
            <label className="text-sm font-medium text-slate-700">
              Nombre público del negocio
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-base"
              />
            </label>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Guardando…"
              idleText="Siguiente"
              disabled={name.length < 2}
              className="bg-teal-600 text-white hover:bg-teal-700"
            />
          </form>
        ) : null}

        {step === 3 ? (
          <form
            className="mt-8 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void nextFrom(3);
            }}
          >
            <label className="text-sm font-medium text-slate-700">
              Logo (archivo opcional)
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50"
              >
                Elegir archivo
              </button>
              <span className="max-w-[220px] truncate text-sm text-slate-500">
                {logoFile ? logoFile.name : "Ningún archivo seleccionado"}
              </span>
            </div>
            {logoPreview ? (
              <div className="relative w-fit">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoPreview}
                  alt="Vista previa del logo"
                  className="h-20 w-20 rounded-xl border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  onClick={clearLogoSelection}
                  className="absolute -top-2 -right-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 shadow-sm transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Eliminar imagen seleccionada"
                >
                  ×
                </button>
              </div>
            ) : null}
            <p className="text-xs text-slate-500">
              Podés subir PNG/JPG/WEBP/GIF (máx 2MB) o saltar este paso. En Vercel hace falta
              Blob configurado.
            </p>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText={logoFile ? "Subiendo logo…" : "Guardando…"}
              idleText="Siguiente"
              className="bg-teal-600 text-white hover:bg-teal-700"
            />
          </form>
        ) : null}

        {step === 4 ? (
          <form
            className="mt-8 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void nextFrom(4);
            }}
          >
            <p className="text-sm text-slate-600">Días abiertos</p>
            <div className="flex flex-wrap gap-2">
              {days.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDay(d.id)}
                  className={`rounded-full px-3 py-2 text-sm font-medium ${
                    openDays.includes(d.id)
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-slate-700">
                Desde
                <TimeSelect
                  name="opensAt"
                  value={opensAt}
                  onChange={setOpensAt}
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Hasta
                <TimeSelect
                  name="closesAt"
                  value={closesAt}
                  onChange={setClosesAt}
                />
              </label>
            </div>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Guardando…"
              idleText="Siguiente"
              disabled={openDays.length === 0}
              className="bg-teal-600 text-white hover:bg-teal-700"
            />
          </form>
        ) : null}

        {step === 6 ? (
          <form
            className="mt-8 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void nextFrom(6);
            }}
          >
            <label className="text-sm font-medium text-slate-700">
              Duración (minutos)
              <input
                type="number"
                min={5}
                max={480}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-base"
              />
            </label>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Guardando…"
              idleText="Siguiente"
              className="bg-teal-600 text-white hover:bg-teal-700"
            />
          </form>
        ) : null}

        {step === 8 ? (
          <form
            className="mt-8 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void nextFrom(8);
            }}
          >
            <label className="text-sm font-medium text-slate-700">
              WhatsApp del negocio
              <div className="mt-1 grid grid-cols-[1fr_1.2fr] gap-2">
                <select
                  value={whatsappCountry}
                  onChange={(e) =>
                    setWhatsappCountry(e.target.value as CountryCode)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none ring-teal-500 focus:ring-2"
                >
                  {countries.map((c) => (
                    <option key={c.iso} value={c.iso}>
                      {c.flag} {c.name} (+{c.callingCode})
                    </option>
                  ))}
                </select>
                <input
                  value={whatsappLocal}
                  onChange={(e) => setWhatsappLocal(e.target.value)}
                  inputMode="tel"
                  placeholder="Tu número local"
                  className="rounded-xl border border-slate-200 px-3 py-3 text-base"
                />
              </div>
            </label>
            <p className="text-xs text-slate-500">
              Seleccioná tu país y escribí solo tu número local (sin +, sin espacios, sin 0
              inicial).
            </p>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Guardando…"
              idleText="Siguiente"
              disabled={whatsappLocal.trim().length < 6}
              className="bg-teal-600 text-white hover:bg-teal-700"
            />
          </form>
        ) : null}

        {step === 9 ? (
          <form
            className="mt-8 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void nextFrom(9);
            }}
          >
            <label className="text-sm font-medium text-slate-700">
              Ubicación (opcional)
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 text-base"
              />
            </label>
            <LoadingButton
              type="submit"
              loading={loading}
              loadingText="Finalizando…"
              idleText="Finalizar"
              className="bg-teal-600 text-white hover:bg-teal-700"
            />
          </form>
        ) : null}
      </main>
    </div>
  );
}
