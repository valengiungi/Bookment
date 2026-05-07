/**
 * Mueve turnos confirmados de un mes calendario a otro (mismo día y hora local en DEFAULT_TIMEZONE).
 *
 * Uso:
 *   npx tsx scripts/shift-bookings-month.ts --slug=TU_SLUG --from=2026-05 --delta=-1
 *   npx tsx scripts/shift-bookings-month.ts --slug=TU_SLUG --from=2026-05 --delta=-1 --dry-run
 *   npx tsx scripts/shift-bookings-month.ts --list
 */

import "dotenv/config";
import { addMonths } from "date-fns";
import { fromZonedTime, toDate, toZonedTime } from "date-fns-tz";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { BookingStatus, PrismaClient } from "../src/generated/prisma";

const TZ = process.env.DEFAULT_TIMEZONE ?? "America/Argentina/Buenos_Aires";

function shiftByCalendarMonths(utcDate: Date, tz: string, delta: number): Date {
  const zoned = toZonedTime(utcDate, tz);
  const shifted = addMonths(zoned, delta);
  return fromZonedTime(shifted, tz);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (name: string) => {
    const pref = `${name}=`;
    const hit = args.find((a) => a.startsWith(pref));
    return hit ? hit.slice(pref.length) : undefined;
  };
  return {
    slug: get("--slug"),
    fromMonth: get("--from"),
    delta: get("--delta"),
    dryRun: args.includes("--dry-run"),
    list: args.includes("--list"),
  };
}

function nextMonthKey(ym: string): string {
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

async function main() {
  const { slug, fromMonth: fromArg, delta: deltaArg, dryRun, list } = parseArgs();

  const cs = process.env.DATABASE_URL;
  if (!cs) {
    console.error("DATABASE_URL no está definida.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: cs });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    if (list) {
      const tenants = await prisma.tenant.findMany({
        where: { active: true },
        select: { slug: true, name: true, id: true },
        orderBy: { slug: "asc" },
      });
      for (const t of tenants) {
        console.log(`${t.slug}\t${t.name}`);
      }
      return;
    }

    const fromMonth = fromArg ?? "2026-05";
    const delta = deltaArg != null ? Number(deltaArg) : -1;

    if (!slug) {
      console.error(
        "Indicá el negocio: --slug=mi-negocio  (o --list para ver slugs)\n" +
          "Ejemplo: npx tsx scripts/shift-bookings-month.ts --slug=mi-negocio --from=2026-05 --delta=-1",
      );
      process.exit(1);
      return;
    }

    if (!/^-?\d+$/.test(String(delta)) || !Number.isFinite(delta)) {
      console.error("--delta debe ser un entero (ej. -1 para un mes atrás).");
      process.exit(1);
      return;
    }

    if (!/^\d{4}-\d{2}$/.test(fromMonth)) {
      console.error("--from debe ser yyyy-MM (ej. 2026-05).");
      process.exit(1);
      return;
    }

    const tenant = await prisma.tenant.findFirst({
      where: { slug, active: true },
      select: { id: true, name: true },
    });
    if (!tenant) {
      console.error(`No existe tenant activo con slug: ${slug}`);
      process.exit(1);
      return;
    }

    const rangeStart = toDate(`${fromMonth}-01T00:00:00`, { timeZone: TZ });
    const rangeEnd = toDate(`${nextMonthKey(fromMonth)}-01T00:00:00`, { timeZone: TZ });

    const bookings = await prisma.booking.findMany({
      where: {
        tenantId: tenant.id,
        status: BookingStatus.CONFIRMED,
        startsAt: { gte: rangeStart, lt: rangeEnd },
      },
      include: { reminders: true },
      orderBy: { startsAt: "asc" },
    });

    console.log(
      `Tenant: ${tenant.name} (${slug})\nZona: ${TZ}\n` +
        `Rango origen: ${fromMonth} (${bookings.length} turnos confirmados)\n` +
        `Desplazamiento: ${delta} mes(es) calendario\n`,
    );

    if (bookings.length === 0) {
      console.log("Nada que actualizar.");
      return;
    }

    if (dryRun) {
      for (const b of bookings) {
        const ns = shiftByCalendarMonths(b.startsAt, TZ, delta);
        const ne = shiftByCalendarMonths(b.endsAt, TZ, delta);
        console.log(
          `${b.id}\t${b.customerName}\t${b.startsAt.toISOString()} -> ${ns.toISOString()} | ends ${ne.toISOString()}`,
        );
      }
      console.log("\n(quité --dry-run para aplicar)");
      return;
    }

    for (const b of bookings) {
      const newStarts = shiftByCalendarMonths(b.startsAt, TZ, delta);
      const newEnds = shiftByCalendarMonths(b.endsAt, TZ, delta);
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: b.id },
          data: { startsAt: newStarts, endsAt: newEnds },
        });
        for (const r of b.reminders) {
          await tx.reminderJob.update({
            where: { id: r.id },
            data: { fireAt: shiftByCalendarMonths(r.fireAt, TZ, delta) },
          });
        }
      });
    }

    console.log(`Listo: ${bookings.length} turnos movidos (${delta} mes(es)).`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
