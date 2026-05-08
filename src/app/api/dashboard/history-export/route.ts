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
      service: { select: { name: true } },
      staff: { select: { name: true } },
    },
  });

  const tz = defaultTimeZone;
  const rows = [
    ["Inicio (local)", "Servicio", "Profesional", "Cliente", "Teléfono", "Email"].join(","),
    ...bookings.map((b) =>
      [
        formatInTimeZone(b.startsAt, tz, "yyyy-MM-dd HH:mm"),
        b.service.name,
        b.staff.name,
        b.customerName,
        b.customerPhone,
        b.customerEmail ?? "",
      ]
        .map((c) => csvEscape(String(c)))
        .join(","),
    ),
  ];

  const body = rows.join("\n");
  const filename = `bookment-${tenant.slug}-reservas.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
