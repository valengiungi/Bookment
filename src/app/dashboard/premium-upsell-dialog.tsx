"use client";

import { useEffect, type ReactNode } from "react";
import {
  BOOKMENT_ADMIN_PHONE,
  bookmentAdminPremiumUpgradeHref,
} from "@/lib/admin-contact";

export function PremiumUpsellDialog({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const adminWa = bookmentAdminPremiumUpgradeHref();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
        <p className="mt-3 text-center sm:text-left">
          {adminWa !== "#" ? (
            <a
              href={adminWa}
              target="_blank"
              rel="noreferrer"
              className="text-base font-semibold text-teal-700 underline decoration-teal-400 decoration-2 underline-offset-2 hover:text-teal-900"
            >
              {BOOKMENT_ADMIN_PHONE}
            </a>
          ) : (
            <span className="text-sm text-slate-500">Número de contacto no configurado.</span>
          )}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Al continuar se abrirá WPP con un mensaje redactado de forma profesional; solo tenés que
          enviarlo para iniciar la gestión.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Cerrar
          </button>
          {adminWa !== "#" ? (
            <a
              href={adminWa}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              Abrir WPP con mensaje listo
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
