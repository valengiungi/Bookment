"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPlanId } from "@/lib/plans";

async function requireSuperAdmin() {
  const s = await auth();
  if (s?.user?.role !== "SUPER_ADMIN") {
    return null;
  }
  return s;
}

export async function setTenantActiveAction(tenantId: string, active: boolean) {
  const session = await requireSuperAdmin();
  if (!session) return { error: "No autorizado." as const };

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { active },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { ok: true as const };
}

export async function setTenantPlanAction(tenantId: string, subscriptionTier: string) {
  const session = await requireSuperAdmin();
  if (!session) return { error: "No autorizado." as const };

  if (!isPlanId(subscriptionTier)) {
    return { error: "Plan no válido." as const };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { subscriptionTier },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { ok: true as const };
}

export async function saveTenantAdminNotesAction(tenantId: string, adminNotes: string) {
  const session = await requireSuperAdmin();
  if (!session) return { error: "No autorizado." as const };

  const trimmed = adminNotes.trim();
  const max = 8000;
  if (trimmed.length > max) {
    return { error: `Las notas no pueden superar ${max} caracteres.` as const };
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { adminNotes: trimmed.length > 0 ? trimmed : null },
  });
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { ok: true as const };
}
