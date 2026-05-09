"use client";

import { useState } from "react";
import { useToast } from "@/components/toast";

export function HistoryExportPanel({ enabled }: { enabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function onDownload() {
    if (!enabled) {
      showToast(
        "Descargar reservas en Excel es solo en plan Premium. Pedilo a quien administra Bookment.",
        "error",
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/history-export");
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        showToast(typeof data.error === "string" ? data.error : "No se pudo exportar.", "error");
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      const match = cd?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "historial-reservas.csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Listo: archivo para Excel / Google Sheets", "success");
    } finally {
      setLoading(false);
    }
  }

  if (enabled) {
    return (
      <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
              Plan Premium
            </p>
            <p className="text-base font-semibold text-slate-900">Descarga para Excel</p>
            <p className="text-sm leading-relaxed text-slate-600">
              Exportá todas las reservas confirmadas en un archivo .csv (abrilo en Excel o Google
              Sheets). Incluye total de turnos y total estimado al final.
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onDownload()}
            className="shrink-0 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? "Generando archivo…" : "Descargar tabla"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
      <span className="font-medium text-slate-800">Descarga Excel:</span> disponible en{" "}
      <strong>Premium</strong>. Pedilo a quien administra Bookment.
    </div>
  );
}
