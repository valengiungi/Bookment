import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="flex-1 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-teal-700 transition hover:text-teal-800 hover:underline"
          >
            Volver a Bookment
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
            {description}
          </p>
        </div>

        <div className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-6 text-sm leading-7 text-slate-700 sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
