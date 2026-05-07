"use client";

import { useFormStatus } from "react-dom";

export function FormSubmitButton({
  idleText,
  loadingText,
  className,
  spinnerClassName,
}: {
  idleText: string;
  loadingText: string;
  className: string;
  /** Si se omite, el spinner usa el color del texto (`current`). */
  spinnerClassName?: string;
}) {
  const { pending } = useFormStatus();
  const spin =
    spinnerClassName ?? "border-current/30 border-t-current";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:opacity-60 ${className}`}
    >
      {pending ? (
        <>
          <span
            className={`h-4 w-4 animate-spin rounded-full border-2 border-solid ${spin}`}
          />
          {loadingText}
        </>
      ) : (
        idleText
      )}
    </button>
  );
}
