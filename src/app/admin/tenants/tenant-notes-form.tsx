"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveTenantAdminNotesAction } from "./actions";

export function TenantNotesForm({
  tenantId,
  initialNotes,
}: {
  tenantId: string;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialNotes ?? "");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await saveTenantAdminNotesAction(tenantId, text);
    setLoading(false);
    if ("error" in res) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Notas solo para super admin (soporte, facturación, acuerdos…)"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-teal-500 focus:ring-2"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
      >
        {loading ? "Guardando…" : "Guardar notas"}
      </button>
    </form>
  );
}
