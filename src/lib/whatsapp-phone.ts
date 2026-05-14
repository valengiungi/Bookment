import { parsePhoneNumberFromString } from "libphonenumber-js";

export function normalizeWhatsAppNumber(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true as const, value: null };
  }

  const parsed = parsePhoneNumberFromString(trimmed);
  if (!parsed || !parsed.isValid()) {
    return {
      ok: false as const,
      message: "Ingresá el número en formato internacional, por ejemplo +5491123456789.",
    };
  }

  return { ok: true as const, value: parsed.number };
}

export function whatsappDigitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}
