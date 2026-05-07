/** Errores de red / pooler que suelen resolverse reintentando (Vercel + Supabase). */
const TRANSIENT_DB =
  /ECONNRESET|ETIMEDOUT|EPIPE|Connection terminated|timeout|too many clients|server closed the connection|Can't reach database|DbConnection/i;

export async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (!TRANSIENT_DB.test(msg) || attempt === 2) {
        throw e;
      }
      await new Promise((r) => setTimeout(r, 120 * (attempt + 1)));
    }
  }
  throw last;
}
