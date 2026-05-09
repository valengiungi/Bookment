import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isReservedSlug } from "@/lib/reserved-slugs";
import { createBooking } from "@/modules/booking/create-booking";

const bodySchema = z.object({
  serviceId: z.string().min(1),
  staffId: z.string().min(1),
  startsAt: z.string().datetime(),
  customerName: z.string().min(2).max(80),
  customerPhone: z.string().min(6).max(32),
  customerEmail: z.string().max(160).optional().nullable(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  if (isReservedSlug(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  if (session?.user?.role === "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Los super admin no reservan desde la página pública. Usá la ficha en Admin." },
      { status: 403 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findFirst({
    where: { slug, active: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  }

  const startsAt = new Date(parsed.data.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const result = await createBooking({
    tenantId: tenant.id,
    serviceId: parsed.data.serviceId,
    staffId: parsed.data.staffId,
    customerName: parsed.data.customerName,
    customerPhone: parsed.data.customerPhone,
    customerEmail: parsed.data.customerEmail,
    startsAt,
  });

  if (!result.ok) {
    const map = {
      SERVICE_NOT_FOUND: 404,
      STAFF_NOT_FOUND: 404,
      SERVICE_STAFF_MISMATCH: 400,
      CLOSED_DAY: 400,
      OUTSIDE_HOURS: 400,
      DOUBLE_BOOK: 409,
      BLOCKED: 400,
      MONTHLY_LIMIT: 403,
    } as const;
    const status = map[result.code];
    const msg: Record<keyof typeof map, string> = {
      SERVICE_NOT_FOUND: "Servicio no disponible",
      STAFF_NOT_FOUND: "Profesional no disponible",
      SERVICE_STAFF_MISMATCH: "Este profesional no ofrece ese servicio",
      CLOSED_DAY: "Día cerrado",
      OUTSIDE_HOURS: "Fuera del horario",
      DOUBLE_BOOK: "Ese horario ya fue reservado",
      BLOCKED: "Horario no disponible",
      MONTHLY_LIMIT:
        "Este mes ya alcanzaste el máximo de turnos de tu plan. Mejorá a Premium o esperá al próximo mes.",
    };
    return NextResponse.json({ error: msg[result.code] }, { status });
  }

  return NextResponse.json({
    ok: true,
    bookingId: result.booking.id,
  });
}
