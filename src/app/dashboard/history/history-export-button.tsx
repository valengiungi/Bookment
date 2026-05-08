"use client";

import { useState } from "react";
import { useToast } from "@/components/toast";

export function HistoryExportButton({ enabled }: { enabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function onClick() {
    if (!enabled) {
      showToast(
        "Descargar reservas en archivo es solo en plan Premium. Hablá con quien administra Bookment.",
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
      showToast("Archivo generado", "success");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void onClick()}
      className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50"
    >
      {loading ? "Generando…" : "Descargar reservas (Premium)"}
    </button>
  );
}
