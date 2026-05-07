import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const hourRow = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  opensAt: z.string().regex(/^\d{2}:\d{2}$/),
  closesAt: z.string().regex(/^\d{2}:\d{2}$/),
});

function inferDefaultServiceName(businessType?: string | null) {
  const t = (businessType ?? "").toLowerCase();
  if (t.includes("barber") || t.includes("pelu")) return "Corte";
  if (t.includes("odon")) return "Consulta odontológica";
  if (t.includes("derma")) return "Consulta dermatológica";
  if (t.includes("psico")) return "Sesión";
  if (t.includes("nutri")) return "Consulta nutricional";
  if (t.includes("abog")) return "Consulta legal";
  if (t.includes("tatu")) return "Sesión de tatuaje";
  if (t.includes("estet")) return "Tratamiento estético";
  return "Turno general";
}

const bodySchema = z.discriminatedUnion("step", [
  z.object({
    step: z.literal(1),
    businessType: z.string().min(2).max(64),
  }),
  z.object({
    step: z.literal(2),
    name: z.string().min(2).max(80),
  }),
  z.object({
    step: z.literal(3),
    logoUrl: z.string().max(500).optional().nullable(),
  }),
  z.object({
    step: z.literal(4),
    hours: z.array(hourRow).min(1),
  }),
  z.object({
    step: z.literal(5),
    serviceName: z.string().min(2).max(80).optional().nullable(),
  }),
  z.object({
    step: z.literal(6),
    durationMinutes: z.number().int().min(5).max(480),
  }),
  z.object({
    step: z.literal(7),
    priceCents: z.number().int().min(0).nullable().optional(),
  }),
  z.object({
    step: z.literal(8),
    whatsapp: z
      .string()
      .regex(
        /^\+[1-9]\d{6,14}$/,
        "WhatsApp inválido. Verificá país y número local.",
      ),
  }),
  z.object({
    step: z.literal(9),
    location: z.string().max(200).optional().nullable(),
  }),
]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const tenantId = session.user.tenantId;
  const data = parsed.data;

  switch (data.step) {
    case 1:
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { businessType: data.businessType, onboardingStep: 1 },
      });
      break;
    case 2:
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { name: data.name, onboardingStep: 2 },
      });
      break;
    case 3:
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { logoUrl: data.logoUrl || null, onboardingStep: 3 },
      });
      break;
    case 4:
      await prisma.workingHour.deleteMany({ where: { tenantId, staffId: null } });
      await prisma.workingHour.createMany({
        data: data.hours.map((h) => ({
          tenantId,
          staffId: null,
          dayOfWeek: h.dayOfWeek,
          opensAt: h.opensAt,
          closesAt: h.closesAt,
        })),
      });
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { onboardingStep: 4 },
      });
      break;
    case 5:
      {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { businessType: true },
      });
      const defaultName = inferDefaultServiceName(tenant?.businessType);
      const serviceName = data.serviceName?.trim() || defaultName;
      await prisma.service.create({
        data: {
          tenantId,
          name: serviceName,
          durationMinutes: 30,
          active: true,
        },
      });
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { onboardingStep: 5 },
      });
      break;
      }
    case 6: {
      const last = await prisma.service.findFirst({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      });
      if (!last) return NextResponse.json({ error: "Sin servicio" }, { status: 400 });
      await prisma.service.update({
        where: { id: last.id },
        data: { durationMinutes: data.durationMinutes },
      });
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { onboardingStep: 6 },
      });
      break;
    }
    case 7: {
      const last = await prisma.service.findFirst({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      });
      if (!last) return NextResponse.json({ error: "Sin servicio" }, { status: 400 });
      await prisma.service.update({
        where: { id: last.id },
        data: { priceCents: data.priceCents ?? null },
      });
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { onboardingStep: 7 },
      });
      break;
    }
    case 8:
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { whatsapp: data.whatsapp, onboardingStep: 8 },
      });
      break;
    case 9:
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          location: data.location || null,
          onboardingStep: 9,
          onboardingDone: true,
        },
      });
      break;
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
