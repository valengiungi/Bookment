/**
 * WhatsApp del equipo Bookment (invitaciones, upgrades de plan).
 * En producción: definí NEXT_PUBLIC_BOOKMENT_ADMIN_PHONE (ej. +5491123456789).
 */
export const BOOKMENT_ADMIN_PHONE =
  process.env.NEXT_PUBLIC_BOOKMENT_ADMIN_PHONE?.trim() || "+54 223 5049768";

export function bookmentAdminWhatsAppDigits(): string {
  return BOOKMENT_ADMIN_PHONE.replace(/\D/g, "");
}

/**
 * Mensaje que recibe el administrador cuando un usuario en plan Simple solicita Premium.
 */
export const BOOKMENT_PREMIUM_UPGRADE_PREFILL =
  "Hola, soy usuario/a de Bookment con el plan Simple. Quiero pasar al plan Premium para poder contactar a mis clientes por WPP desde el panel. ¿Me podrían indicar los pasos y las condiciones? Quedo atento/a. Muchas gracias.";

export const BOOKMENT_BLOCKED_ACCOUNT_PREFILL =
  "Hola, tengo mi cuenta de Bookment bloqueada y no puedo usar el panel. ¿Me podrían indicar cómo regularizarla? Muchas gracias.";

export function bookmentAdminPremiumUpgradeHref(): string {
  const n = bookmentAdminWhatsAppDigits();
  if (!n) return "#";
  return `https://wa.me/${n}?text=${encodeURIComponent(BOOKMENT_PREMIUM_UPGRADE_PREFILL)}`;
}

export function bookmentAdminBlockedAccountHref(): string {
  const n = bookmentAdminWhatsAppDigits();
  if (!n) return "#";
  return `https://wa.me/${n}?text=${encodeURIComponent(BOOKMENT_BLOCKED_ACCOUNT_PREFILL)}`;
}
