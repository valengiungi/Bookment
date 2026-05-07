import Link from "next/link";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[color:var(--card)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Bookment
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Ingresar
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--accent-hover)]"
          >
            Creá tu cuenta
          </Link>
        </nav>
      </div>
    </header>
  );
}
