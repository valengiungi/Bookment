import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicAppOrigin } from "@/lib/public-app-url";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token")?.trim();
  const origin = getPublicAppOrigin();

  if (!token) {
    return NextResponse.redirect(`${origin}/login?verify=invalid`);
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true } } },
  });

  if (!row || row.expiresAt < new Date()) {
    return NextResponse.redirect(`${origin}/login?verify=expired`);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.delete({ where: { id: row.id } }),
  ]);

  return NextResponse.redirect(`${origin}/login?verified=1`);
}
