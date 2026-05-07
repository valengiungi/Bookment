"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cancelBooking } from "@/app/dashboard/actions";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function onConfirmCancel() {
    setLoading(true);
    await cancelBooking(bookingId);
    setLoading(false);
    setConfirming(false);
    window.dispatchEvent(new CustomEvent("bookment:dashboard-inicio-refresh"));
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="shrink-0 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        Cancelar
      </button>
    );
  }

  return (
    <div className="flex max-w-full flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50/80 p-2 sm:flex-row sm:items-center sm:justify-end">
      <span className="text-xs font-medium text-rose-900">¿Cancelar este turno?</span>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={loading}
          onClick={() => void onConfirmCancel()}
          className="rounded-lg border border-rose-400 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-50"
        >
          {loading ? "…" : "Sí"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          No
        </button>
      </div>
    </div>
  );
}
