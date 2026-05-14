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
  if (session.user.role === "EMPLOYEE") {
    return NextResponse.json(
      { error: "Solo el dueño del negocio puede exportar este Excel." },
      { status: 403 },
    );
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

  const [bookings, expenses] = await Promise.all([
    prisma.booking.findMany({
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
    }),
    prisma.tenantExpense.findMany({
      where: { tenantId },
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
      take: 20_000,
      select: {
        expenseDate: true,
        kind: true,
        name: true,
        amountArs: true,
        note: true,
      },
    }),
  ]);

  const tz = defaultTimeZone;
  const buffer = await buildHistoryExportXlsxBuffer({
    tenantName: tenant.name,
    tz,
    bookings,
    expenses,
  });

  const filename = `bookment-${tenant.slug}-historial.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
