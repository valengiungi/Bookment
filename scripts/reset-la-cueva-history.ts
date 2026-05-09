/**
 * Borra todos los turnos de "La Cueva" (slug emi-barber o nombre) y crea unos pocos
 * confirmados en meses pasados (historial de ejemplo).
 *
 *   npx tsx scripts/reset-la-cueva-history.ts
 */

import "dotenv/config";
import { addMinutes } from "date-fns";
import { toDate } from "date-fns-tz";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { BookingStatus, PrismaClient } from "../src/generated/prisma";

const TZ = process.env.DEFAULT_TIMEZONE ?? "America/Argentina/Buenos_Aires";
const BUFFER_MIN = 5;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { slug: "emi-barber" },
        { name: { contains: "cueva", mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, slug: true },
  });

  if (!tenant) {
    console.error("No se encontró el negocio (slug emi-barber o nombre con 'cueva').");
    process.exit(1);
  }

  console.log("Negocio:", tenant.name, "| slug:", tenant.slug);

  const deleted = await prisma.booking.deleteMany({ where: { tenantId: tenant.id } });
  console.log("Turnos borrados:", deleted.count);

  const [services, staffList] = await Promise.all([
    prisma.service.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.staff.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!services.length || !staffList.length) {
    console.error("Falta servicio o profesional activo; no se crearon turnos de ejemplo.");
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  }

  const service = services[0]!;
  const staff = staffList[0]!;
  const blockMinutes = service.durationMinutes + BUFFER_MIN;

  const samples: { ymd: string; time: string; customerName: string; customerPhone: string }[] = [
    { ymd: "2026-02-04", time: "10:30", customerName: "María González", customerPhone: "+54 9 11 5001-2200" },
    { ymd: "2026-02-18", time: "15:00", customerName: "Lucas Pérez", customerPhone: "+54 9 11 5001-2201" },
    { ymd: "2026-03-07", time: "11:15", customerName: "Ana Ferreyra", customerPhone: "+54 9 11 5001-2202" },
    { ymd: "2026-03-21", time: "09:30", customerName: "Diego Ríos", customerPhone: "+54 9 11 5001-2203" },
    { ymd: "2026-04-02", time: "16:45", customerName: "Carla Méndez", customerPhone: "+54 9 11 5001-2204" },
    { ymd: "2026-04-19", time: "14:00", customerName: "Federico Costa", customerPhone: "+54 9 11 5001-2205" },
  ];

  for (const s of samples) {
    const startsAt = toDate(`${s.ymd}T${s.time}:00`, { timeZone: TZ });
    const endsAt = addMinutes(startsAt, blockMinutes);
    await prisma.booking.create({
      data: {
        tenantId: tenant.id,
        serviceId: service.id,
        staffId: staff.id,
        customerName: s.customerName,
        customerPhone: s.customerPhone,
        startsAt,
        endsAt,
        status: BookingStatus.CONFIRMED,
      },
    });
  }

  console.log("Turnos de ejemplo creados:", samples.length, `(${service.name} · ${staff.name})`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
