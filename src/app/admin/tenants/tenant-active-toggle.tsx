"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setTenantActiveAction } from "./actions";

export function TenantActiveToggle({
  tenantId,
  active,
}: {
  tenantId: string;
  active: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (
      !confirm(
        active
          ? "¿Pausar este negocio? No podrá operar con normalidad hasta reactivarlo."
          : "¿Reactivar este negocio?",
      )
    ) {
      return;
    }
    setLoading(true);
    const res = await setTenantActiveAction(tenantId, !active);
    setLoading(false);
    if ("error" in res) {
      alert(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void toggle()}
      className={
        active
          ? "rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50"
          : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-100 disabled:opacity-50"
      }
    >
      {loading ? "…" : active ? "Pausar negocio" : "Reactivar negocio"}
    </button>
  );
}
