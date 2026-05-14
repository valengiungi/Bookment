"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  isBillingCycleValue,
  nextDueFromPaidAt,
  parseAdminDateInput,
} from "@/app/admin/tenants/billing-utils";
import { prisma } from "@/lib/prisma";
import { isPlanId } from "@/lib/plans";

const DELETE_WORD = "ELIMINAR";

async function requireSuperAdmin() {
  const s = await auth();
  if (s?.user?.role !== "SUPER_ADMIN") {
    return null;
  }
  return s;
}

export type DeleteAdminTenantFormState = {
  tone: "idle" | "success" | "error" | "warning";
  text: string | null;
};

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
  /** El negocio debe ver límites, historial y export al instante */
  revalidatePath("/dashboard", "layout");
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

export async function saveTenantBillingPaymentAction(formData: FormData) {
  const session = await requireSuperAdmin();
  if (!session) return { error: "No autorizado." as const };

  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const planId = String(formData.get("planId") ?? "").trim();
  const billingCycle = String(formData.get("billingCycle") ?? "").trim();
  const amountRaw = String(formData.get("amountArs") ?? "").trim();
  const paidAtRaw = String(formData.get("paidAt") ?? "").trim();
  const noteRaw = String(formData.get("note") ?? "").trim();

  if (!tenantId) return { error: "Negocio no válido." as const };
  if (!isPlanId(planId)) return { error: "Plan no válido." as const };
  if (!isBillingCycleValue(billingCycle)) return { error: "Modalidad no válida." as const };

  const amountArs = Number.parseInt(amountRaw.replace(/[^\d-]/g, ""), 10);
  if (!Number.isFinite(amountArs) || amountArs <= 0) {
    return { error: "Importe no válido." as const };
  }

  const paidAt = parseAdminDateInput(paidAtRaw);
  if (!paidAt) {
    return { error: "Fecha de pago no válida." as const };
  }

  const note = noteRaw.length > 0 ? noteRaw.slice(0, 4000) : null;
  const nextDueAt = nextDueFromPaidAt(paidAt, billingCycle);

  await prisma.tenantBillingPayment.create({
    data: {
      tenantId,
      planId,
      billingCycle,
      amountArs,
      paidAt,
      nextDueAt,
      note,
    },
  });

  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${tenantId}`);
  return { ok: true as const };
}

export async function deleteTenantFromAdminAction(
  _prevState: DeleteAdminTenantFormState,
  formData: FormData,
): Promise<DeleteAdminTenantFormState> {
  const session = await requireSuperAdmin();
  if (!session) {
    return { tone: "error", text: "No autorizado." };
  }

  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const confirmName = String(formData.get("confirmName") ?? "").trim();
  const confirmPhrase = String(formData.get("confirmPhrase") ?? "").trim();
  const understood = String(formData.get("understood") ?? "") === "yes";

  if (!tenantId) {
    return { tone: "error", text: "Negocio no válido." };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true },
  });
  if (!tenant) {
    return { tone: "error", text: "No encontramos ese negocio." };
  }

  if (confirmName !== tenant.name) {
    return {
      tone: "warning",
      text: "El nombre del negocio no coincide exactamente.",
    };
  }

  if (confirmPhrase !== DELETE_WORD) {
    return {
      tone: "warning",
      text: `Tenés que escribir ${DELETE_WORD} en mayúsculas.`,
    };
  }

  if (!understood) {
    return {
      tone: "warning",
      text: "Marcá la casilla de confirmación para continuar.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.staff.updateMany({
      where: { tenantId },
      data: { userId: null },
    });
    await tx.user.deleteMany({ where: { tenantId } });
    await tx.tenant.delete({ where: { id: tenantId } });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/tenants");
  revalidatePath(`/admin/tenants/${tenantId}`);

  return {
    tone: "success",
    text: "Negocio eliminado permanentemente.",
  };
}
