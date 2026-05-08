/**
 * Crea o actualiza la cuenta de dueño de la plataforma (SUPER_ADMIN, sin negocio asociado).
 *
 * Definí en .env:
 *   PLATFORM_OWNER_EMAIL=...        (opcional; por defecto giungivalen@gmail.com)
 *   PLATFORM_OWNER_PASSWORD=...     (obligatorio para ejecutar este seed)
 *
 *   npm run db:seed
 */
import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient, Role } from "../src/generated/prisma";

const email =
  process.env.PLATFORM_OWNER_EMAIL?.trim().toLowerCase() ?? "giungivalen@gmail.com";
const password = process.env.PLATFORM_OWNER_PASSWORD?.trim();

async function main() {
  if (!password) {
    console.log(
      "Seed omitido: agregá PLATFORM_OWNER_PASSWORD en .env y volvé a ejecutar npm run db:seed",
    );
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida.");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const passwordHash = await hash(password, 10);
  const now = new Date();

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name: "Administración Bookment",
      role: Role.SUPER_ADMIN,
      emailVerified: now,
      tenantId: null,
    },
    update: {
      passwordHash,
      role: Role.SUPER_ADMIN,
      emailVerified: now,
      tenantId: null,
    },
  });

  console.log(`Super admin listo: ${email} (ingresá en /login como cualquier usuario).`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
