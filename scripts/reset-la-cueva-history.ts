/**
 * Borra todos los turnos de "La Cueva" (slug emi-barber o nombre) y crea turnos de ejemplo
 * en meses pasados, con volumen desigual por mes (algunos meses más cargados que otros).
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

  /**
   * Misma distribución mensual que antes, pero varios clientes repiten nombre+teléfono
   * (así el groupBy del Historial arma bien el top). Frecuencias totales:
   * María 5, Lucas 4, Ana 3 (las 3 en marzo), Diego 2, Carla 2.
   */
  const samples: { ymd: string; time: string; customerName: string; customerPhone: string }[] = [
    // 2026-01 — 2
    { ymd: "2026-01-08", time: "10:00", customerName: "María González", customerPhone: "+54 9 11 5001-2200" },
    { ymd: "2026-01-22", time: "17:30", customerName: "Valentina Sosa", customerPhone: "+54 9 11 5001-2206" },
    // 2026-02 — 4
    { ymd: "2026-02-04", time: "10:30", customerName: "María González", customerPhone: "+54 9 11 5001-2200" },
    { ymd: "2026-02-11", time: "12:00", customerName: "Lucas Pérez", customerPhone: "+54 9 11 5001-2201" },
    { ymd: "2026-02-18", time: "15:00", customerName: "Carla Méndez", customerPhone: "+54 9 11 5001-2204" },
    { ymd: "2026-02-27", time: "09:00", customerName: "Martín Ibáñez", customerPhone: "+54 9 11 5001-2207" },
    // 2026-03 — 12 (pico; Ana concentra 3 turnos este mes → #1 del top marzo)
    { ymd: "2026-03-03", time: "09:30", customerName: "Diego Ríos", customerPhone: "+54 9 11 5001-2203" },
    { ymd: "2026-03-05", time: "11:00", customerName: "Lucas Pérez", customerPhone: "+54 9 11 5001-2201" },
    { ymd: "2026-03-07", time: "11:15", customerName: "Ana Ferreyra", customerPhone: "+54 9 11 5001-2202" },
    { ymd: "2026-03-10", time: "16:00", customerName: "María González", customerPhone: "+54 9 11 5001-2200" },
    { ymd: "2026-03-12", time: "10:45", customerName: "Julieta Morán", customerPhone: "+54 9 11 5001-2208" },
    { ymd: "2026-03-14", time: "14:30", customerName: "Ana Ferreyra", customerPhone: "+54 9 11 5001-2202" },
    { ymd: "2026-03-18", time: "09:15", customerName: "Nicolás Vega", customerPhone: "+54 9 11 5001-2209" },
    { ymd: "2026-03-19", time: "17:00", customerName: "Paula Domínguez", customerPhone: "+54 9 11 5001-2210" },
    { ymd: "2026-03-21", time: "09:30", customerName: "Ana Ferreyra", customerPhone: "+54 9 11 5001-2202" },
    { ymd: "2026-03-25", time: "12:30", customerName: "María González", customerPhone: "+54 9 11 5001-2200" },
    { ymd: "2026-03-28", time: "15:45", customerName: "Lucas Pérez", customerPhone: "+54 9 11 5001-2201" },
    { ymd: "2026-03-31", time: "11:00", customerName: "Bruno Acosta", customerPhone: "+54 9 11 5001-2217" },
    // 2026-04 — 5
    { ymd: "2026-04-02", time: "16:45", customerName: "Agustina Rey", customerPhone: "+54 9 11 5001-2218" },
    { ymd: "2026-04-08", time: "10:00", customerName: "Diego Ríos", customerPhone: "+54 9 11 5001-2203" },
    { ymd: "2026-04-12", time: "13:15", customerName: "Carla Méndez", customerPhone: "+54 9 11 5001-2204" },
    { ymd: "2026-04-19", time: "14:00", customerName: "María González", customerPhone: "+54 9 11 5001-2200" },
    { ymd: "2026-04-26", time: "09:45", customerName: "Rocío Peralta", customerPhone: "+54 9 11 5001-2220" },
    // 2026-05 — 3
    { ymd: "2026-05-02", time: "10:30", customerName: "Lucas Pérez", customerPhone: "+54 9 11 5001-2201" },
    { ymd: "2026-05-04", time: "11:30", customerName: "Iván Molina", customerPhone: "+54 9 11 5001-2223" },
    { ymd: "2026-05-06", time: "16:00", customerName: "Hernán Suárez", customerPhone: "+54 9 11 5001-2225" },
  ];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i]!;
    const service = services[i % services.length]!;
    const staff = staffList[i % staffList.length]!;
    const blockMinutes = service.durationMinutes + BUFFER_MIN;
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

  const byMonth = samples.reduce<Record<string, number>>((acc, row) => {
    const key = row.ymd.slice(0, 7);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const byClient = samples.reduce<Record<string, number>>((acc, row) => {
    const key = `${row.customerName}|${row.customerPhone}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const repeatClients = Object.entries(byClient)
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k.split("|")[0]}: ${n}`);
  console.log("Turnos de ejemplo creados:", samples.length, "| por mes:", byMonth);
  console.log("Clientes con más de un turno:", repeatClients.join(" · "));

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
