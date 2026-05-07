"use client";

import { signOut } from "next-auth/react";

export function UserBar({ email }: { email?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      {email ? (
        <span className="hidden max-w-[140px] truncate text-xs text-slate-500 sm:inline">
          {email}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
      >
        Salir
      </button>
    </div>
  );
}
