"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteUnusedSignupInviteAction } from "./actions";

export function RevokeInviteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onRevoke() {
    if (!confirm("¿Anular este código sin usar? No se podrá registrar nadie con él.")) return;
    setLoading(true);
    const res = await deleteUnusedSignupInviteAction(id);
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
      onClick={() => void onRevoke()}
      className="text-sm text-red-700 hover:underline disabled:opacity-50"
    >
      {loading ? "…" : "Anular"}
    </button>
  );
}
