import type { ReactNode } from "react";

/** Candado compacto para funciones solo Premium */
export function LockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`inline shrink-0 text-amber-700 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/** Etiqueta suave para zonas activas del plan Premium */
export function PremiumActiveBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-900 shadow-sm ring-1 ring-violet-200/80 ${className}`}
    >
      <span className="text-violet-600" aria-hidden>
        ✦
      </span>
      Premium
    </span>
  );
}

/** Tarjeta “teaser” para usuarios Simple: muestra lo que desbloquearían */
export function PremiumLockedTeaser({
  title,
  children,
  footnote,
}: {
  title: string;
  children: ReactNode;
  footnote?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-300/90 bg-gradient-to-br from-amber-50/95 via-white to-slate-50 p-5 shadow-inner">
      <div className="absolute right-4 top-4 rounded-full bg-amber-100 p-2 shadow-sm ring-1 ring-amber-200">
        <LockIcon className="h-5 w-5 text-amber-800" />
      </div>
      <p className="pr-14 text-sm font-semibold text-amber-950">{title}</p>
      <div className="mt-3 space-y-2 text-sm text-slate-700">{children}</div>
      {footnote ? (
        <p className="mt-4 border-t border-amber-200/80 pt-3 text-xs leading-relaxed text-amber-900/90">
          {footnote}
        </p>
      ) : null}
    </div>
  );
}
