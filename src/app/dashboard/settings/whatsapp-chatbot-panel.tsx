"use client";

import { useActionState } from "react";
import {
  type TenantWhatsappChatbotFormState,
  setTenantWhatsappChatbotMode,
} from "@/app/dashboard/actions";
import { FormSubmitButton } from "@/components/form-submit-button";
import { bookmentAdminPremiumUpgradeHref } from "@/lib/admin-contact";
import { READONLY_CHATBOT_SAMPLE_QUERIES } from "@/modules/whatsapp-chatbot/shared";

export function WhatsAppChatbotPanel({
  mode,
  isPremium,
  businessWhatsapp,
  linkedAccountsCount,
}: {
  mode: "DISABLED" | "READ_ONLY";
  isPremium: boolean;
  businessWhatsapp: string | null;
  linkedAccountsCount: number;
}) {
  const [state, formAction] = useActionState<TenantWhatsappChatbotFormState, FormData>(
    setTenantWhatsappChatbotMode,
    {
      tone: "idle",
      text: null,
    },
  );

  const isEnabled = mode === "READ_ONLY";
  const nextMode = isEnabled ? "DISABLED" : "READ_ONLY";
  const feedbackClassName =
    state.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : state.tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <div className="mt-3 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            isEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
          }`}
        >
          {isEnabled ? "Activo solo lectura" : "Desactivado"}
        </span>
        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
          Premium
        </span>
      </div>

      <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3">
          <p className="font-medium text-slate-900">Qué puede hacer</p>
          <p className="mt-1 text-xs text-slate-500">
            Responde consultas de agenda por fecha. No modifica turnos.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3">
          <p className="font-medium text-slate-900">Requisitos</p>
          <p className="mt-1 text-xs text-slate-500">
            WhatsApp del negocio: {businessWhatsapp ? businessWhatsapp : "pendiente"} · cuentas
            vinculadas: {linkedAccountsCount}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3">
        <p className="text-sm font-medium text-slate-900">Mensajes que entiende</p>
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {READONLY_CHATBOT_SAMPLE_QUERIES.map((query) => (
            <li key={query}>• {query}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Si alguien pide cancelar o reprogramar, el asistente responde que eso se hace manualmente
          desde el panel.
        </p>
      </div>

      {state.text ? (
        <p className={`rounded-xl border px-3 py-2 text-sm ${feedbackClassName}`}>{state.text}</p>
      ) : null}

      {!isPremium ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p>Este asistente está disponible solo para negocios con plan Premium.</p>
          <a
            href={bookmentAdminPremiumUpgradeHref()}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex text-sm font-semibold text-amber-900 underline"
          >
            Pedir upgrade por WhatsApp
          </a>
        </div>
      ) : (
        <form action={formAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="mode" value={nextMode} />
          <FormSubmitButton
            idleText={isEnabled ? "Desactivar asistente" : "Activar modo solo lectura"}
            loadingText={isEnabled ? "Desactivando…" : "Activando…"}
            className={`px-4 py-2 text-sm text-white ${
              isEnabled
                ? "rounded-xl bg-slate-900 hover:bg-slate-800"
                : "rounded-xl bg-violet-600 hover:bg-violet-700"
            }`}
          />
        </form>
      )}
    </div>
  );
}
