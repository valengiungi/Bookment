"use client";

import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale/es";
import { createPortal } from "react-dom";
import { useCallback, useMemo, useState } from "react";
import { PremiumUpsellDialog } from "./premium-upsell-dialog";

function waHref(phone: string, body: string) {
  const n = phone.replace(/\D/g, "");
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(body)}`;
}

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

export function BookingReminderButton({
  isPremium,
  timeZone,
  customerPhone,
  customerName,
  startsAtIso,
  serviceName,
  staffName,
  businessName,
}: {
  isPremium: boolean;
  timeZone: string;
  customerPhone: string;
  customerName: string;
  startsAtIso: string;
  serviceName: string;
  staffName: string;
  businessName: string;
}) {
  const [showUpsell, setShowUpsell] = useState(false);
  const closeUpsell = useCallback(() => setShowUpsell(false), []);

  const href = useMemo(() => {
    const who = businessName.trim() || "el equipo";
    const d = new Date(startsAtIso);
    const dateLine = formatInTimeZone(d, timeZone, "EEEE d 'de' MMMM yyyy", { locale: es });
    const timeLine = formatInTimeZone(d, timeZone, "HH:mm");
    const body = [
      `Hola ${customerName},`,
      "",
      "Te escribo para recordarte tu turno:",
      `📅 ${dateLine} a las ${timeLine}`,
      `💇 ${serviceName}`,
      `👤 Con ${staffName}`,
      "",
      "Cualquier cosa, estamos a disposición.",
      `Saludos, ${who}`,
    ].join("\n");
    return waHref(customerPhone, body);
  }, [
    businessName,
    customerName,
    customerPhone,
    serviceName,
    staffName,
    startsAtIso,
    timeZone,
  ]);

  if (isPremium) {
    if (!href) {
      return (
        <span className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">
          Sin teléfono
        </span>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-100"
      >
        Recordatorio
      </a>
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
        Recordatorio
      </button>
      {showUpsell
        ? createPortal(
            <PremiumUpsellDialog
              onClose={closeUpsell}
              title="Plan Premium — recordatorio por WPP"
            >
              <p>
                Enviar un <strong className="font-medium text-slate-800">recordatorio manual</strong>{" "}
                por WhatsApp al cliente, con el mensaje armado, está incluido en el{" "}
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
