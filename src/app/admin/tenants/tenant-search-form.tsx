"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function TenantSearchForm({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(initialQ);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(sp.toString());
    const t = q.trim();
    if (t) next.set("q", t);
    else next.delete("q");
    router.push(`/admin/tenants?${next.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Nombre, slug o email…"
        className="min-w-[240px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-teal-500 focus:ring-2"
      />
      <button
        type="submit"
        className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
      >
        Buscar
      </button>
    </form>
  );
}
