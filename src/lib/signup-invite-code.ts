import { createHash } from "node:crypto";

/** Normaliza y hashea el código que escribe el usuario (solo trim; respeta mayúsculas/minúsculas). */
export function hashSignupInviteCode(raw: string): string {
  return createHash("sha256").update(raw.trim(), "utf8").digest("hex");
}
