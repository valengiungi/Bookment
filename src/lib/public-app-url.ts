/**
 * Base URL pública para textos compartibles (ej. link del negocio en ajustes).
 * En Vercel, `VERCEL_URL` en previews suele ser un subdominio distinto al de producción;
 * `VERCEL_PROJECT_PRODUCTION_URL` apunta al dominio estable (ej. bookment-app.vercel.app).
 */
export function getPublicAppOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    const host = production.replace(/^https?:\/\//, "").split("/")[0]?.replace(/\/$/, "") ?? "";
    if (host) return `https://${host}`;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").split("/")[0]?.replace(/\/$/, "") ?? "";
    if (host) return `https://${host}`;
  }

  const auth = process.env.AUTH_URL?.trim().replace(/\/$/, "");
  if (auth) return auth;

  return "http://localhost:3000";
}
