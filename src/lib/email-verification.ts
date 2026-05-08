import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getPublicAppOrigin } from "@/lib/public-app-url";
import { sendTransactionalEmail } from "@/lib/send-email";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export async function createVerificationTokenAndSendEmail(
  userId: string,
  email: string,
): Promise<{ verifyUrl: string }> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + VERIFY_TTL_MS);

  await prisma.emailVerificationToken.deleteMany({ where: { userId } });
  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  const base = getPublicAppOrigin();
  const verifyUrl = `${base}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  await sendTransactionalEmail({
    to: email,
    subject: "Verificá tu correo — Bookment",
    html: `
      <p>Hola,</p>
      <p>Para activar tu cuenta en Bookment, hacé clic en el siguiente enlace:</p>
      <p><a href="${verifyUrl}" style="color:#0d9488;font-weight:600;">Verificar mi correo</a></p>
      <p style="color:#64748b;font-size:14px;">El enlace vence en 24 horas. Si no creaste una cuenta, ignorá este mensaje.</p>
    `,
  });

  return { verifyUrl };
}
