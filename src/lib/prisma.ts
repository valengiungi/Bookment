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
    // Vercel: pocas conexiones por instancia + pooler (Supabase) en DATABASE_URL con ?pgbouncer=true
    const isServerless = Boolean(process.env.VERCEL);
    globalForPrisma.pgPool = new Pool({
      connectionString,
      max: isServerless ? 1 : 10,
      idleTimeoutMillis: isServerless ? 3_000 : 30_000,
      connectionTimeoutMillis: 15_000,
    });
  }
  return globalForPrisma.pgPool;
}

function createPrisma() {
  const pool = getPool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
