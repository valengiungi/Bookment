/** Errores de red / pooler que suelen resolverse reintentando (Vercel + Supabase). */
const TRANSIENT_MSG =
  /ECONNRESET|ETIMEDOUT|EPIPE|Connection terminated|timeout|too many clients|server closed the connection|Can't reach database|DbConnection|Prepared statement|08P01/i;

const TRANSIENT_PRISMA = new Set(["P1001", "P1008", "P1017", "P2024"]);

function isTransientDbError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  if (TRANSIENT_MSG.test(msg)) return true;
  if (
    e &&
    typeof e === "object" &&
    "code" in e &&
    typeof (e as { code: unknown }).code === "string"
  ) {
    return TRANSIENT_PRISMA.has((e as { code: string }).code);
  }
  return false;
}

export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!isTransientDbError(e) || attempt === 2) {
        throw e;
      }
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
    }
  }
  throw last;
}
