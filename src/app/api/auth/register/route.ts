import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@/generated/prisma";
import { createVerificationTokenAndSendEmail } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import { ensureUniqueTenantSlug, slugify } from "@/lib/slug";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.string().email()),
  password: z.string().min(8),
  businessName: z.string().trim().min(2).max(80),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const msg = first?.message ?? "Revisá email, contraseña (8+) y nombre del negocio.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const email = parsed.data.email;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (existing?.emailVerified) {
    return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
  }

  if (existing && !existing.emailVerified) {
    try {
      const { verifyUrl } = await createVerificationTokenAndSendEmail(existing.id, email);
      const showDevLink =
        process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY?.trim();
      return NextResponse.json({
        ok: true,
        needsVerification: true,
        resent: true,
        ...(showDevLink ? { devVerificationLink: verifyUrl } : {}),
      });
    } catch (e) {
      console.error("[register resend]", e);
      return NextResponse.json(
        {
          error:
            "No pudimos reenviar el correo. Revisá RESEND_API_KEY en el servidor o probá más tarde.",
        },
        { status: 503 },
      );
    }
  }

  const passwordHash = await hash(parsed.data.password, 10);
  const slug = await ensureUniqueTenantSlug(slugify(parsed.data.businessName) || "negocio");

  let tenantId: string;
  let userId: string;

  try {
    const tenant = await prisma.tenant.create({
      data: {
        slug,
        name: parsed.data.businessName,
        users: {
          create: {
            email,
            passwordHash,
            name: parsed.data.businessName,
            role: Role.OWNER,
          },
        },
        staff: {
          create: {
            name: parsed.data.businessName,
          },
        },
      },
      include: { users: { take: 1, select: { id: true } } },
    });

    const uid = tenant.users[0]?.id;
    if (!uid) {
      await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
      throw new Error("Usuario no creado");
    }
    tenantId = tenant.id;
    userId = uid;
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json(
      {
        error:
          "No pudimos guardar en la base de datos. Revisá que PostgreSQL esté encendido y que DATABASE_URL en .env sea correcta.",
      },
      { status: 503 },
    );
  }

  try {
    const { verifyUrl } = await createVerificationTokenAndSendEmail(userId, email);
    const showDevLink =
      process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY?.trim();
    return NextResponse.json({
      ok: true,
      needsVerification: true,
      tenantSlug: slug,
      ...(showDevLink ? { devVerificationLink: verifyUrl } : {}),
    });
  } catch (e) {
    console.error("[register verify email]", e);
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {});
    return NextResponse.json(
      {
        error:
          "Cuenta no creada: no pudimos enviar el correo de verificación. Configurá RESEND_API_KEY (producción) o revisá los logs.",
      },
      { status: 503 },
    );
  }
}
