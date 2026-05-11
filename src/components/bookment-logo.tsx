type BookmentLogoProps = {
  /** `lockup`: tamaño barra. `mark`: texto un poco más chico. */
  variant?: "lockup" | "mark";
  className?: string;
};

/** Solo wordmark “Bookment” (sin imagen). */
export function BookmentLogo({ variant = "lockup", className }: BookmentLogoProps) {
  const textClass =
    variant === "mark"
      ? "text-base font-semibold tracking-tight"
      : "text-lg font-semibold tracking-tight sm:text-xl";

  return (
    <span
      className={["select-none inline-flex items-center", textClass, className].filter(Boolean).join(" ")}
    >
      <span className="text-teal-600">Book</span>
      <span className="text-slate-900">ment</span>
    </span>
  );
}
