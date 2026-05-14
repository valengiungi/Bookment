"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type StaffAccessFormState, upsertStaffAccess } from "@/app/dashboard/actions";
import { FormSubmitButton } from "@/components/form-submit-button";

export function StaffAccessPanel({
  staffId,
  staffName,
  currentEmail,
  feedback,
}: {
  staffId: string;
  staffName: string;
  currentEmail?: string | null;
  feedback?: {
    tone: "success" | "error" | "warning";
    text: string;
  } | null;
}) {
  const isEditing = Boolean(currentEmail);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(Boolean(feedback && feedback.tone !== "success"));
  const [state, formAction] = useActionState<StaffAccessFormState, FormData>(upsertStaffAccess, {
    tone: feedback?.tone ?? "idle",
    text: feedback?.text ?? null,
  });
  const visibleFeedback = state.tone !== "idle" ? state : feedback;
  const feedbackClassName =
    visibleFeedback?.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : visibleFeedback?.tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900";

  useEffect(() => {
    if (state.tone === "success") {
      setIsOpen(false);
      router.refresh();
    }
  }, [router, state]);

  useEffect(() => {
    if (state.tone === "warning" || state.tone === "error") {
      setIsOpen(true);
    }
  }, [state.tone]);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
    >
      <summary className="cursor-pointer list-none text-sm font-medium text-slate-800">
        {isEditing ? "Editar acceso del profesional" : "Crear acceso para este profesional"}
      </summary>

      <div className="mt-3 space-y-3">
        <p className="text-xs text-slate-500">
          {isEditing
            ? `${staffName} ya entra con ${currentEmail}. Si dejás la contraseña vacía, se mantiene la actual.`
            : `Creale un email y una contraseña a ${staffName} para que vea solo su agenda.`}
        </p>

        {visibleFeedback ? (
          <p className={`rounded-xl border px-3 py-2 text-xs ${feedbackClassName}`} role="alert">
            {visibleFeedback.text}
          </p>
        ) : null}

        <form action={formAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="staffId" value={staffId} />

          <label className="block text-sm text-slate-700">
            Email
            <input
              name="email"
              type="email"
              required
              defaultValue={currentEmail ?? ""}
              placeholder="barbero@negocio.com"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </label>

          <label className="block text-sm text-slate-700">
            {isEditing ? "Nueva contraseña" : "Contraseña"}
            <input
              name="password"
              type="password"
              placeholder={isEditing ? "Opcional" : "Mínimo 8 caracteres"}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
            <span className="mt-1 block text-xs text-slate-500">
              {isEditing
                ? "Dejala vacía si no querés cambiarla."
                : "Obligatoria para crear el acceso. Mínimo 8 caracteres."}
            </span>
          </label>

          <div className="sm:col-span-2">
            <FormSubmitButton
              idleText={isEditing ? "Guardar acceso" : "Crear acceso"}
              loadingText={isEditing ? "Guardando…" : "Creando…"}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
            />
          </div>
        </form>
      </div>
    </details>
  );
}
