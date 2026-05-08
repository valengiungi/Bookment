import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma";

const needle = process.argv[2] ?? "valen kinesio";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const tenants = await prisma.tenant.findMany({
    where: { name: { contains: needle, mode: "insensitive" } },
    select: {
      name: true,
      slug: true,
      users: { select: { email: true, role: true } },
    },
  });

  for (const t of tenants) {
    console.log("Negocio:", t.name, "| slug:", t.slug);
    for (const u of t.users) {
      console.log("  email:", u.email, "| rol:", u.role);
    }
  }

  if (tenants.length === 0) {
    console.log("No hay tenants con nombre que contenga:", needle);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
