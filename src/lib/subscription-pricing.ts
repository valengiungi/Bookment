/**
 * Precio de lista mensual por plan (ARS, sin impuestos).
 * Defaults pensados para un SaaS de turnos en Argentina: accesible en Simple, ~2,5× en Premium.
 *
 * Override sin tocar código:
 *   SUBSCRIPTION_PRICE_SIMPLE_ARS=7990
 *   SUBSCRIPTION_PRICE_PREMIUM_ARS=19990
 */

const DEFAULT_SIMPLE_ARS = 7_990;
const DEFAULT_PREMIUM_ARS = 19_990;

function parsePriceArs(envVal: string | undefined, fallback: number): number {
  if (!envVal?.trim()) return fallback;
  const n = Number.parseInt(envVal.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Solo variables de entorno + default (semilla y entornos sin BD). */
export function envMonthlyPriceSimpleArs(): number {
  return parsePriceArs(process.env.SUBSCRIPTION_PRICE_SIMPLE_ARS, DEFAULT_SIMPLE_ARS);
}

export function envMonthlyPricePremiumArs(): number {
  return parsePriceArs(process.env.SUBSCRIPTION_PRICE_PREMIUM_ARS, DEFAULT_PREMIUM_ARS);
}

/** @deprecated Preferir getConfiguredListPrices() desde la app (persiste en BD). */
export function monthlyPriceSimpleArs(): number {
  return envMonthlyPriceSimpleArs();
}

/** @deprecated Preferir getConfiguredListPrices() desde la app (persiste en BD). */
export function monthlyPricePremiumArs(): number {
  return envMonthlyPricePremiumArs();
}

export function formatArs(amount: number): string {
  return `$${Math.round(amount).toLocaleString("es-AR")}`;
}
