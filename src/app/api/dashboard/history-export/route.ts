import { formatInTimeZone } from "date-fns-tz";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canExportData } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { defaultTimeZone } from "@/lib/timezone";

function csvEscape(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(cells: string[]): string {
  return cells.map((c) => csvEscape(String(c))).join(",");
}

function formatArsFromCents(cents: number): string {
  return (cents / 100).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function blankRows(n: number): string[] {
  return Array.from({ length: n }, () => "");
}

export async function GET() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { subscriptionTier: true, slug: true, name: true },
  });
  if (!tenant || !canExportData(tenant.subscriptionTier)) {
    return NextResponse.json(
      { error: "Export disponible solo en plan Premium." },
      { status: 403 },
    );
  }

  const bookings = await prisma.booking.findMany({
    where: { tenantId, status: "CONFIRMED" },
    orderBy: { startsAt: "desc" },
    take: 20_000,
    select: {
      startsAt: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      service: { select: { name: true, priceCents: true } },
      staff: { select: { name: true } },
    },
  });

  const tz = defaultTimeZone;
  const generatedAt = formatInTimeZone(new Date(), tz, "dd/MM/yyyy HH:mm");

  const turnosHeader = [
    "Inicio (hora local)",
    "Servicio",
    "Profesional",
    "Cliente",
    "Teléfono",
    "Email",
    "Precio servicio ($)",
    "Importe línea ($)",
  ];

  let totalCents = 0;
  const turnosRows = bookings.map((b) => {
    const lineCents = b.service.priceCents ?? 0;
    totalCents += lineCents;
    return row([
      formatInTimeZone(b.startsAt, tz, "yyyy-MM-dd HH:mm"),
      b.service.name,
      b.staff.name,
      b.customerName,
      b.customerPhone,
      b.customerEmail ?? "",
      formatArsFromCents(lineCents),
      formatArsFromCents(lineCents),
    ]);
  });

  const n = bookings.length;
  const avgCents = n > 0 ? Math.round(totalCents / n) : 0;

  const rows: string[] = [
    row(["Bookment — exportación de reservas", "", "", "", "", "", "", ""]),
    row(["Negocio", tenant.name, "", "", "", "", "", ""]),
    row(["Archivo generado", generatedAt, "", "", "", "", "", ""]),
    row(["Zona horaria referencia", tz, "", "", "", "", "", ""]),
    ...blankRows(2),
    row(["1 — TURNOS (detalle)", "", "", "", "", "", "", ""]),
    row([
      "Listado de reservas confirmadas. Orden: más recientes primero.",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]),
    ...blankRows(1),
    row(turnosHeader),
    ...turnosRows,
    ...blankRows(3),
    row(["2 — BALANCE (estimado)", "", ""]),
    row([
      "Totales según el precio cargado en cada servicio. No representa cobros reales.",
      "",
      "",
    ]),
    ...blankRows(1),
    row(["Concepto", "Valor", ""]),
    row(["Cantidad de turnos en la tabla 1", String(n), ""]),
    row(["Total estimado ($)", formatArsFromCents(totalCents), ""]),
    row(["Promedio por turno ($)", n > 0 ? formatArsFromCents(avgCents) : "—", ""]),
  ];

  const body = `\uFEFF${rows.join("\n")}`;
  const filename = `bookment-${tenant.slug}-reservas.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
