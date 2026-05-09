"use client";

import { useState } from "react";
import { useToast } from "@/components/toast";
import { PremiumActiveBadge, PremiumLockedTeaser } from "@/components/premium-visuals";

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
      const filename = match?.[1] ?? "historial-reservas.xlsx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Listo: descargaste un Excel (.xlsx) con turnos y balance", "success");
    } finally {
      setLoading(false);
    }
  }

  if (enabled) {
    return (
      <div className="rounded-2xl border-2 border-violet-300/90 bg-gradient-to-br from-violet-50 via-white to-violet-50/80 p-5 shadow-md shadow-violet-900/5 ring-1 ring-violet-200/70 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <PremiumActiveBadge />
              <p className="text-base font-semibold text-slate-900">Descarga para Excel</p>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              Archivo <strong className="text-violet-950">Excel .xlsx</strong>: hoja{" "}
              <em>Turnos</em> con columnas, filtros y formato profesional; hoja{" "}
              <em>Balance</em> con totales estimados.
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void onDownload()}
            className="shrink-0 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? "Generando Excel…" : "Descargar Excel"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <PremiumLockedTeaser
      title="Descarga profesional en Excel — disponible en Premium"
      footnote="Pedí el upgrade a quien administra Bookment: pasás a tener el mismo archivo que ves arriba, listo para contadores o para tu propio control."
    >
      <p className="flex items-start gap-2">
        <span className="mt-0.5 text-violet-600" aria-hidden>
          ✓
        </span>
        Tablas con bordes, totales y dos hojas (turnos + balance).
      </p>
      <p className="flex items-start gap-2">
        <span className="mt-0.5 text-violet-600" aria-hidden>
          ✓
        </span>
        Compatible con Excel y Google Sheets.
      </p>
    </PremiumLockedTeaser>
  );
}
