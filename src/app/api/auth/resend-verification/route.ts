import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createVerificationTokenAndSendEmail } from "@/lib/email-verification";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.string().email()),
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
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const email = parsed.data.email;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { verifyUrl } = await createVerificationTokenAndSendEmail(user.id, email);
    const showDevLink =
      process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY?.trim();
    return NextResponse.json({
      ok: true,
      ...(showDevLink ? { devVerificationLink: verifyUrl } : {}),
    });
  } catch (e) {
    console.error("[resend-verification]", e);
    return NextResponse.json(
      {
        error:
          "No pudimos enviar el correo. Probá más tarde o revisá la configuración del servidor.",
      },
      { status: 503 },
    );
  }
}
