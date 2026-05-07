"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  kind: ToastKind;
};

type ToastContextValue = {
  showToast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_MS = 2400;

function toastIcon(kind: ToastKind) {
  if (kind === "success") return "✓";
  if (kind === "error") return "!";
  return "i";
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_MS);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-3 bottom-3 z-[100] flex max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`relative overflow-hidden rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
              t.kind === "success"
                ? "bg-teal-600"
                : t.kind === "error"
                  ? "bg-rose-600"
                  : "bg-slate-800"
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                {toastIcon(t.kind)}
              </span>
              <span>{t.message}</span>
            </div>
            <span
              className="toast-progress absolute bottom-0 left-0 h-0.5 w-full bg-white/65"
              style={{ animationDuration: `${TOAST_MS}ms` }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
