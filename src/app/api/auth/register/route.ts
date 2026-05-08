import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@/generated/prisma";
import { signupEmailSchema } from "@/lib/email-shape";
import { prisma } from "@/lib/prisma";
import { ensureUniqueTenantSlug, slugify } from "@/lib/slug";
import { hashSignupInviteCode } from "@/lib/signup-invite-code";

const bodySchema = z.object({
  email: signupEmailSchema,
  password: z.string().min(8),
  businessName: z.string().trim().min(2).max(80),
  inviteCode: z.string().min(1, "El código de invitación es obligatorio."),
});

export async function POST(req: Request) {
  const unusedCount = await prisma.signupInviteCode.count({ where: { usedAt: null } });
  if (unusedCount === 0) {
    return NextResponse.json(
      {
        error:
          "No hay códigos de invitación disponibles. Pedile uno al administrador de la plataforma.",
      },
      { status: 503 },
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
    const first = parsed.error.issues[0];
    const msg = first?.message ?? "Revisá los datos del formulario.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const codeHash = hashSignupInviteCode(parsed.data.inviteCode);

  const reserved = await prisma.signupInviteCode.updateMany({
    where: { codeHash, usedAt: null },
    data: { usedAt: new Date() },
  });

  if (reserved.count !== 1) {
    return NextResponse.json(
      { error: "Código de invitación incorrecto o ya fue usado." },
      { status: 403 },
    );
  }

  const email = parsed.data.email;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    await prisma.signupInviteCode.updateMany({
      where: { codeHash },
      data: { usedAt: null },
    });
    return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
  }

  const passwordHash = await hash(parsed.data.password, 10);
  const slug = await ensureUniqueTenantSlug(slugify(parsed.data.businessName) || "negocio");
  const now = new Date();

  try {
    await prisma.tenant.create({
      data: {
        slug,
        name: parsed.data.businessName,
        users: {
          create: {
            email,
            passwordHash,
            name: parsed.data.businessName,
            role: Role.OWNER,
            emailVerified: now,
          },
        },
        staff: {
          create: {
            name: parsed.data.businessName,
          },
        },
      },
    });
  } catch (err) {
    console.error("[register]", err);
    await prisma.signupInviteCode.updateMany({
      where: { codeHash },
      data: { usedAt: null },
    });
    return NextResponse.json(
      {
        error:
          "No pudimos guardar en la base de datos. Revisá que PostgreSQL esté encendido y que DATABASE_URL en .env sea correcta.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, tenantSlug: slug });
}
