"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useState } from "react";
import { PremiumUpsellDialog } from "./premium-upsell-dialog";

function LockGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M11 6V4a3 3 0 10-6 0v2H4a1 1 0 00-1 1v6a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1h-1zm-1 0H6V4a2 2 0 114 0v2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function EditBookingDashboardButton({
  isPremium,
  bookingId,
}: {
  isPremium: boolean;
  bookingId: string;
}) {
  const [showUpsell, setShowUpsell] = useState(false);
  const closeUpsell = useCallback(() => setShowUpsell(false), []);

  if (isPremium) {
    return (
      <Link
        href={`/dashboard/bookings/${bookingId}/edit`}
        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
      >
        Editar
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowUpsell(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-400 bg-amber-100 px-3 py-2 text-sm font-medium text-amber-950 hover:bg-amber-200"
      >
        <LockGlyph className="h-3.5 w-3.5 opacity-90" />
        Editar
      </button>
      {showUpsell
        ? createPortal(
            <PremiumUpsellDialog
              onClose={closeUpsell}
              title="Plan Premium — editar turnos"
            >
              <p>
                <strong className="font-medium text-slate-800">Editar turnos</strong> desde el panel
                (fecha, servicio y profesional) está incluido en el{" "}
                <strong className="font-medium text-slate-800">plan Premium</strong> de Bookment.
              </p>
              <p>
                Para solicitar el cambio de plan o recibir información al respecto, por favor{" "}
                <strong className="font-medium text-slate-800">comunicate con el administrador</strong>{" "}
                de la plataforma al siguiente número:
              </p>
            </PremiumUpsellDialog>,
            document.body,
          )
        : null}
    </>
  );
}
