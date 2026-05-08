/**
 * Planes: Simple (base) y Premium.
 * Valores viejos en DB (free, starter, pro) → mapeo legacy.
 */

export const PLAN_IDS = ["simple", "premium"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type PlanDefinition = {
  id: PlanId;
  label: string;
  short: string;
  /** Servicios activos / configurados — evita abuso del catálogo */
  maxServices: number | null;
  /** Profesionales — típico upsell cuando el negocio crece */
  maxStaff: number | null;
  /**
   * Turnos confirmados por mes calendario (zona del negocio).
   * Es el límite más “real” para cobrar: volumen de la agenda.
   */
  maxMonthlyBookings: number | null;
  /** Descarga de reservas (.csv, abre en Excel / planillas) */
  allowDataExport: boolean;
  /** Métricas de facturación estimada y ranking de clientes en pantalla Historial */
  allowRevenueInsights: boolean;
  /**
   * Tras una reserva pública, se ofrece avisar al negocio por WhatsApp (wa.me).
   * En Simple el turno solo queda cargado: el dueño lo ve al entrar al panel.
   */
  notifyBusinessOnPublicBooking: boolean;
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  simple: {
    id: "simple",
    label: "Simple",
    short: "Negocio chico o probando la agenda",
    maxServices: 4,
    maxStaff: 2,
    maxMonthlyBookings: 80,
    allowDataExport: false,
    allowRevenueInsights: false,
    notifyBusinessOnPublicBooking: false,
  },
  premium: {
    id: "premium",
    label: "Premium",
    short: "Volumen, reporting y control de datos",
    maxServices: null,
    maxStaff: null,
    maxMonthlyBookings: null,
    allowDataExport: true,
    allowRevenueInsights: true,
    notifyBusinessOnPublicBooking: true,
  },
};

const LEGACY_TO_PLAN: Record<string, PlanId> = {
  free: "simple",
  starter: "simple",
  pro: "premium",
};

export function isPlanId(value: string): value is PlanId {
  return (PLAN_IDS as readonly string[]).includes(value);
}

export function getEffectivePlanId(storedTier: string): PlanId {
  if (isPlanId(storedTier)) return storedTier;
  if (storedTier in LEGACY_TO_PLAN) return LEGACY_TO_PLAN[storedTier];
  return "simple";
}

export function planDefinitionForTenant(storedTier: string): PlanDefinition {
  return PLANS[getEffectivePlanId(storedTier)];
}

export function planLabel(tier: string): string {
  return planDefinitionForTenant(tier).label;
}

export function formatLimit(n: number | null): string {
  if (n === null) return "Ilimitado";
  return String(n);
}
