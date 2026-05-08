import { prisma } from "@/lib/prisma";
import { envMonthlyPricePremiumArs, envMonthlyPriceSimpleArs } from "@/lib/subscription-pricing";

export const PLATFORM_PRICING_ID = "default";

export type PlatformPricingRow = {
  id: string;
  configuredSimpleArs: number;
  configuredPremiumArs: number;
  reportingSimpleArs: number;
  reportingPremiumArs: number;
  configChangedAt: Date | null;
};

export async function ensurePlatformPricing(): Promise<PlatformPricingRow> {
  const defS = envMonthlyPriceSimpleArs();
  const defP = envMonthlyPricePremiumArs();
  return prisma.platformPricing.upsert({
    where: { id: PLATFORM_PRICING_ID },
    create: {
      id: PLATFORM_PRICING_ID,
      configuredSimpleArs: defS,
      configuredPremiumArs: defP,
      reportingSimpleArs: defS,
      reportingPremiumArs: defP,
    },
    update: {},
  });
}

/** Precios de lista (landing, MRR, snapshots nuevos): lo último que guardó el admin. */
export async function getConfiguredListPrices(): Promise<{ simple: number; premium: number }> {
  const row = await ensurePlatformPricing();
  return {
    simple: row.configuredSimpleArs,
    premium: row.configuredPremiumArs,
  };
}

/** Alias histórico: mismo valor que los precios configurados. */
export async function getEffectiveReportPrices(): Promise<{ simple: number; premium: number }> {
  return getConfiguredListPrices();
}

export async function ensureEconomiaMonthSnapshot(args: {
  monthKey: string;
  activeSimple: number;
  activePremium: number;
  priceSimple: number;
  pricePremium: number;
}): Promise<void> {
  const exists = await prisma.economiaMonthSnapshot.findUnique({
    where: { monthKey: args.monthKey },
  });
  if (exists) return;
  const mrrTotalArs =
    args.activeSimple * args.priceSimple + args.activePremium * args.pricePremium;
  await prisma.economiaMonthSnapshot.create({
    data: {
      monthKey: args.monthKey,
      activeSimple: args.activeSimple,
      activePremium: args.activePremium,
      priceSimpleArs: args.priceSimple,
      pricePremiumArs: args.pricePremium,
      mrrTotalArs: mrrTotalArs,
    },
  });
}
