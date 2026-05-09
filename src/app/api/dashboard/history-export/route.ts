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

function formatArsFromCents(cents: number): string {
  return (cents / 100).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export async function GET() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { subscriptionTier: true, slug: true },
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
  const header = [
    "Inicio (hora local)",
    "Servicio",
    "Profesional",
    "Cliente",
    "Teléfono",
    "Email",
    "Precio servicio (ARS)",
    "Importe línea (ARS)",
  ];

  let totalCents = 0;
  const dataLines = bookings.map((b) => {
    const lineCents = b.service.priceCents ?? 0;
    totalCents += lineCents;
    return [
      formatInTimeZone(b.startsAt, tz, "yyyy-MM-dd HH:mm"),
      b.service.name,
      b.staff.name,
      b.customerName,
      b.customerPhone,
      b.customerEmail ?? "",
      formatArsFromCents(lineCents),
      formatArsFromCents(lineCents),
    ]
      .map((c) => csvEscape(String(c)))
      .join(",");
  });

  const n = bookings.length;
  const avgCents = n > 0 ? Math.round(totalCents / n) : 0;

  const summaryLines = [
    "",
    ["Resumen", "", "", "", "", "", "Turnos exportados", String(n)].join(","),
    ["", "", "", "", "", "", "Total estimado (ARS)", formatArsFromCents(totalCents)].join(","),
    ["", "", "", "", "", "", "Promedio por turno (ARS)", formatArsFromCents(avgCents)].join(","),
  ];

  const rows = [header.join(","), ...dataLines, ...summaryLines];
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
