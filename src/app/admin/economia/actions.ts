"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLATFORM_PRICING_ID, ensurePlatformPricing } from "@/lib/platform-pricing";

async function requireSuperAdmin() {
  const s = await auth();
  if (s?.user?.role !== "SUPER_ADMIN") return null;
  return s;
}

function parseArsField(raw: string, label: string): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: `Completá ${label}.` };
  const n = Number.parseInt(trimmed.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(n) || n < 0) return { ok: false, error: `${label}: monto inválido.` };
  if (n > 99_999_999) return { ok: false, error: `${label}: demasiado alto.` };
  return { ok: true, value: n };
}

export type UpdatePlatformPricingState = { error?: string; ok?: boolean };

/**
 * Firma de una sola entrada como el resto de server actions del repo.
 * useActionState en el cliente envuelve y pasa (prevState, formData) a su callback;
 * no uses esta función directamente como primer argumento de useActionState.
 */
export async function updatePlatformPricingForm(
  formData: FormData,
): Promise<UpdatePlatformPricingState> {
  const session = await requireSuperAdmin();
  if (!session) return { error: "No autorizado." };

  const simpleRaw = String(formData.get("simpleArs") ?? "");
  const premiumRaw = String(formData.get("premiumArs") ?? "");
  const a = parseArsField(simpleRaw, "Simple");
  if (!a.ok) return { error: a.error };
  const b = parseArsField(premiumRaw, "Premium");
  if (!b.ok) return { error: b.error };

  try {
    await ensurePlatformPricing();

    await prisma.platformPricing.upsert({
      where: { id: PLATFORM_PRICING_ID },
      create: {
        id: PLATFORM_PRICING_ID,
        reportingSimpleArs: a.value,
        reportingPremiumArs: b.value,
        configuredSimpleArs: a.value,
        configuredPremiumArs: b.value,
        configChangedAt: null,
      },
      update: {
        reportingSimpleArs: a.value,
        reportingPremiumArs: b.value,
        configuredSimpleArs: a.value,
        configuredPremiumArs: b.value,
        configChangedAt: null,
      },
    });
  } catch (e) {
    console.error("updatePlatformPricingForm", e);
    return { error: "No se pudo guardar. Revisá la consola del servidor o probá de nuevo." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/economia");
  revalidatePath("/admin/plans");
  revalidatePath("/");
  return { ok: true };
}
