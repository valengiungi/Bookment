/**
 * Borra todos los turnos de "La Cueva" (slug emi-barber o nombre) y crea turnos de ejemplo
 * en meses pasados. Cada turno se coloca en un día y hora donde el profesional tiene
 * ventana cargada en workingHour (misma lógica que la agenda pública).
 *
 *   npx tsx scripts/reset-la-cueva-history.ts
 */

import "dotenv/config";
import { addDays, addMinutes } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { BookingStatus, PrismaClient, type WorkingHour } from "../src/generated/prisma";
import { getStaffDayWindow, POST_SERVICE_BUFFER_MINUTES } from "../src/modules/calendar/slots";

const TZ = process.env.DEFAULT_TIMEZONE ?? "America/Argentina/Buenos_Aires";

function toMinutes(hm: string): number {
  const [h, m] = hm.split(":").map((x) => Number.parseInt(x, 10));
  return h * 60 + m;
}

function formatMin(total: number): string {
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function addCalendarDays(ymd: string, delta: number, tz: string): string {
  const noon = toDate(`${ymd}T12:00:00`, { timeZone: tz });
  return formatInTimeZone(addDays(noon, delta), tz, "yyyy-MM-dd");
}

/** Primer día abierto desde preferredYmd: primero intenta quedarse en el mismo mes calendario. */
function resolveOpenYmd(
  preferredYmd: string,
  staffId: string,
  wh: WorkingHour[],
  tz: string,
): string | null {
  const targetMonth = preferredYmd.slice(0, 7);
  for (let i = 0; i < 31; i++) {
    const cand = addCalendarDays(preferredYmd, i, tz);
    if (cand.slice(0, 7) !== targetMonth) break;
    if (getStaffDayWindow(wh, staffId, cand, tz)) return cand;
  }
  for (let i = 0; i < 60; i++) {
    const cand = addCalendarDays(preferredYmd, i, tz);
    if (getStaffDayWindow(wh, staffId, cand, tz)) return cand;
  }
  return null;
}

function clampStartTime(
  timeHHMM: string,
  window: { opensAt: string; closesAt: string },
  blockMinutes: number,
): string {
  const t = toMinutes(timeHHMM);
  const o = toMinutes(window.opensAt);
  const c = toMinutes(window.closesAt);
  let s = t;
  if (s < o) s = o;
  if (s + blockMinutes > c) s = Math.max(o, c - blockMinutes);
  if (s < o) s = o;
  return formatMin(s);
}

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

  const [services, staffList, workingHours] = await Promise.all([
    prisma.service.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.staff.findMany({
      where: { tenantId: tenant.id, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.workingHour.findMany({ where: { tenantId: tenant.id } }),
  ]);

  if (!services.length || !staffList.length) {
    console.error("Falta servicio o profesional activo; no se crearon turnos de ejemplo.");
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  }

  if (!workingHours.length) {
    console.error("No hay horarios base cargados (workingHour). Cargalos en el panel antes de sembrar.");
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  }

  /**
   * Intención de mes / clientes repetidos; fechas y horas se ajustan a días abiertos y a la franja.
   * Frecuencias por cliente (nombre+tel): María 5, Lucas 4, Ana 3, Carla 2, Diego 2.
   */
  const samples: { ymd: string; time: string; customerName: string; customerPhone: string }[] = [
    { ymd: "2026-01-08", time: "10:00", customerName: "María González", customerPhone: "+54 9 11 5001-2200" },
    { ymd: "2026-01-22", time: "17:30", customerName: "Valentina Sosa", customerPhone: "+54 9 11 5001-2206" },
    { ymd: "2026-02-04", time: "10:30", customerName: "María González", customerPhone: "+54 9 11 5001-2200" },
    { ymd: "2026-02-11", time: "12:00", customerName: "Lucas Pérez", customerPhone: "+54 9 11 5001-2201" },
    { ymd: "2026-02-18", time: "15:00", customerName: "Carla Méndez", customerPhone: "+54 9 11 5001-2204" },
    { ymd: "2026-02-27", time: "09:00", customerName: "Martín Ibáñez", customerPhone: "+54 9 11 5001-2207" },
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
    { ymd: "2026-04-02", time: "16:45", customerName: "Agustina Rey", customerPhone: "+54 9 11 5001-2218" },
    { ymd: "2026-04-08", time: "10:00", customerName: "Diego Ríos", customerPhone: "+54 9 11 5001-2203" },
    { ymd: "2026-04-12", time: "13:15", customerName: "Carla Méndez", customerPhone: "+54 9 11 5001-2204" },
    { ymd: "2026-04-19", time: "14:00", customerName: "María González", customerPhone: "+54 9 11 5001-2200" },
    { ymd: "2026-04-26", time: "09:45", customerName: "Rocío Peralta", customerPhone: "+54 9 11 5001-2220" },
    { ymd: "2026-05-02", time: "10:30", customerName: "Lucas Pérez", customerPhone: "+54 9 11 5001-2201" },
    { ymd: "2026-05-04", time: "11:30", customerName: "Iván Molina", customerPhone: "+54 9 11 5001-2223" },
    { ymd: "2026-05-06", time: "16:00", customerName: "Hernán Suárez", customerPhone: "+54 9 11 5001-2225" },
  ];

  const booked: { staffId: string; startsAt: Date; endsAt: Date }[] = [];
  function hasClash(staffId: string, start: Date, end: Date): boolean {
    return booked.some((b) => b.staffId === staffId && start < b.endsAt && end > b.startsAt);
  }

  const placed: { ymd: string; customerName: string; customerPhone: string }[] = [];
  let skipped = 0;

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i]!;
    const service = services[i % services.length]!;
    const staff = staffList[i % staffList.length]!;
    const blockMinutes = service.durationMinutes + POST_SERVICE_BUFFER_MINUTES;

    let ymd = resolveOpenYmd(s.ymd, staff.id, workingHours, TZ);
    if (!ymd) {
      console.warn("Sin día abierto para", s.customerName, "desde", s.ymd);
      skipped++;
      continue;
    }

    let win = getStaffDayWindow(workingHours, staff.id, ymd, TZ);
    if (!win) {
      skipped++;
      continue;
    }

    let time = clampStartTime(s.time, win, blockMinutes);
    let startsAt = toDate(`${ymd}T${time}:00`, { timeZone: TZ });
    let endsAt = addMinutes(startsAt, blockMinutes);

    let guard = 0;
    while (hasClash(staff.id, startsAt, endsAt) && guard < 80) {
      guard++;
      const nextMin = toMinutes(time) + 15;
      const closeMin = toMinutes(win.closesAt);
      if (nextMin + blockMinutes > closeMin) {
        const nextYmd = resolveOpenYmd(addCalendarDays(ymd, 1, TZ), staff.id, workingHours, TZ);
        if (!nextYmd || nextYmd === ymd) break;
        ymd = nextYmd;
        win = getStaffDayWindow(workingHours, staff.id, ymd, TZ);
        if (!win) break;
        time = clampStartTime(win.opensAt, win, blockMinutes);
      } else {
        time = formatMin(nextMin);
      }
      startsAt = toDate(`${ymd}T${time}:00`, { timeZone: TZ });
      endsAt = addMinutes(startsAt, blockMinutes);
    }

    if (hasClash(staff.id, startsAt, endsAt)) {
      console.warn("No se pudo colocar sin solapar:", s.customerName, s.ymd);
      skipped++;
      continue;
    }

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
    booked.push({ staffId: staff.id, startsAt, endsAt });
    placed.push({ ymd: formatInTimeZone(startsAt, TZ, "yyyy-MM-dd"), customerName: s.customerName, customerPhone: s.customerPhone });
  }

  const byMonth = placed.reduce<Record<string, number>>((acc, row) => {
    const key = row.ymd.slice(0, 7);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const byClient = placed.reduce<Record<string, number>>((acc, row) => {
    const key = `${row.customerName}|${row.customerPhone}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const repeatClients = Object.entries(byClient)
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k.split("|")[0]}: ${n}`);

  console.log(
    "Turnos creados:",
    placed.length,
    skipped ? `(omitidos: ${skipped})` : "",
    "| por mes (fechas reales):",
    byMonth,
  );
  console.log("Clientes con más de un turno:", repeatClients.join(" · "));

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
