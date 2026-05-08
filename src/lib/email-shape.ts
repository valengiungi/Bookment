import { z } from "zod";

/** Email con @ y dominio con punto (ej. usuario@algo.com). Sin envío de correo. */
export const signupEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "El email es obligatorio.")
  .refine(
    (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s),
    "Ingresá un email con formato válido (ej. nombre@servicio.com).",
  );
