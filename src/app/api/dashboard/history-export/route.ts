import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canExportData } from "@/lib/plan-limits";
import { buildHistoryExportXlsxBuffer } from "@/lib/history-export-xlsx";
import { prisma } from "@/lib/prisma";
import { defaultTimeZone } from "@/lib/timezone";

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
  const buffer = await buildHistoryExportXlsxBuffer({
    tenantName: tenant.name,
    tz,
    bookings,
  });

  const filename = `bookment-${tenant.slug}-reservas.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
