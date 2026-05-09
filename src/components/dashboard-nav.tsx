"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockIcon } from "@/components/premium-visuals";

const links = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/dashboard/clients", label: "Clientes" },
  { href: "/dashboard/history", label: "Historial" },
  { href: "/dashboard/services", label: "Servicios" },
  { href: "/dashboard/hours", label: "Horarios" },
  { href: "/dashboard/blocks", label: "Bloqueos" },
  { href: "/dashboard/settings", label: "Ajustes" },
];

export function DashboardNav({
  publicHref,
  isPremium,
}: {
  publicHref: string;
  /** Si es false (plan Simple), mostramos candado en enlaces con extras Premium */
  isPremium: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 py-2 sm:flex-wrap sm:px-4">
        {links.map((l) => {
          const active = pathname === l.href;
          const premiumHint =
            !isPremium && (l.href === "/dashboard/history" || l.href === "/dashboard/services");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap ${
                active
                  ? "bg-teal-50 text-teal-800"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {l.label}
              {premiumHint ? (
                <span title="Incluye extras Premium" className="inline-flex">
                  <LockIcon className="h-3 w-3 text-amber-600/90" />
                </span>
              ) : null}
            </Link>
          );
        })}
        <Link
          href={publicHref}
          target="_blank"
          rel="noreferrer"
          className="hidden sm:ml-auto sm:inline-flex shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
        >
          Abrir página pública
        </Link>
      </div>
    </nav>
  );
}
