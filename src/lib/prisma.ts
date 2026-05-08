import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForPrisma.pgPool) {
    // Supabase (y similares): pocos slots por proyecto. Varias conexiones desde el mismo
    // proceso agotan el límite → "Max client connections reached". max=1 + URL pooler (6543)
    // con ?pgbouncer=true es lo recomendado para Prisma.
    globalForPrisma.pgPool = new Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 20_000,
    });
  }
  return globalForPrisma.pgPool;
}

function createPrisma() {
  const pool = getPool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/**
 * En desarrollo no guardamos el cliente en global: tras `prisma generate` el módulo
 * del cliente se actualiza pero una instancia vieja en global seguiría sin los nuevos modelos
 * (p. ej. `platformPricing` undefined). En producción sí reutilizamos para el pool.
 */
export const prisma =
  process.env.NODE_ENV === "production"
    ? (globalForPrisma.prisma ??= createPrisma())
    : createPrisma();
