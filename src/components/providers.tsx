"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/toast";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session}>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
