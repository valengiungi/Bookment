import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Role } from "@/generated/prisma";
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
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
  }

  const passwordHash = await hash(parsed.data.password, 10);
  const slug = await ensureUniqueTenantSlug(slugify(parsed.data.businessName) || "negocio");

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
    });

    return NextResponse.json({
      ok: true,
      tenantSlug: tenant.slug,
    });
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
}
