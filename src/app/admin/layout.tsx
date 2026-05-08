import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserBar } from "@/components/user-bar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-semibold text-slate-900">
              Super admin
            </Link>
            <Link href="/admin/tenants" className="text-sm text-slate-600 hover:text-slate-900">
              Negocios
            </Link>
            <Link href="/admin/plans" className="text-sm text-slate-600 hover:text-slate-900">
              Planes
            </Link>
            <Link href="/admin/invites" className="text-sm text-slate-600 hover:text-slate-900">
              Invitaciones
            </Link>
            <Link href="/admin/economia" className="text-sm text-slate-600 hover:text-slate-900">
              Economía
            </Link>
          </div>
          <UserBar email={session.user.email} />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
