"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useToast } from "@/components/toast";

export function LogoEditPanel({ initialLogoUrl }: { initialLogoUrl: string | null }) {
  const router = useRouter();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads/logo", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        showToast(
          typeof data.error === "string" ? data.error : "No se pudo actualizar el logo.",
          "error",
        );
        return;
      }
      showToast("Logo actualizado", "success");
      router.refresh();
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="shrink-0">
        {initialLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={initialLogoUrl}
            alt=""
            className="h-24 w-24 rounded-2xl border border-slate-200 object-cover shadow-sm"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            Sin logo
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(ev) => void onPick(ev)}
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="w-fit rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? "Subiendo…" : initialLogoUrl ? "Cambiar logo" : "Subir logo"}
        </button>
        <p className="text-xs text-slate-500">
          PNG, JPG, WEBP o GIF. Máx. 2 MB. En producción (Vercel) hace falta Vercel Blob configurado.
        </p>
      </div>
    </div>
  );
}
