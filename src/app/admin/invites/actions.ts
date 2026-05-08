"use server";

import { randomBytes } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/send-email";
import { hashSignupInviteCode } from "@/lib/signup-invite-code";

async function requireSuperAdmin() {
  const s = await auth();
  return s?.user?.role === "SUPER_ADMIN" ? s : null;
}

export async function createSignupInviteAction(note: string | null) {
  const session = await requireSuperAdmin();
  if (!session) {
    return { error: "No autorizado." as const };
  }

  const plain = randomBytes(12).toString("hex");
  const codeHash = hashSignupInviteCode(plain);

  try {
    await prisma.signupInviteCode.create({
      data: {
        codeHash,
        note: note?.trim() || null,
      },
    });
  } catch (e) {
    console.error("[createSignupInvite]", e);
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `No se pudo crear el código: ${msg}` as const };
  }

  const ownerEmail = process.env.PLATFORM_OWNER_EMAIL?.trim();
  if (ownerEmail) {
    try {
      await sendTransactionalEmail({
        to: ownerEmail,
        subject: "Bookment — nuevo código de invitación",
        html: `
          <p>Hola,</p>
          <p>Se generó un código de invitación para que alguien cree una cuenta en Bookment.</p>
          <p style="font-size:18px;font-weight:600;letter-spacing:0.05em;font-family:ui-monospace,monospace;">${plain}</p>
          ${note?.trim() ? `<p>Nota: ${escapeHtml(note.trim())}</p>` : ""}
          <p style="color:#64748b;font-size:14px;">Compartilo con la persona que va a registrarse (es de un solo uso). Si no configuraste Resend, este mail no se envió: el código sigue visible en el panel.</p>
        `,
      });
    } catch (err) {
      console.error("[createSignupInvite] correo al dueño", err);
    }
  }

  return { ok: true as const, plainCode: plain };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function deleteUnusedSignupInviteAction(id: string) {
  const session = await requireSuperAdmin();
  if (!session) {
    return { error: "No autorizado." as const };
  }

  const row = await prisma.signupInviteCode.findFirst({
    where: { id, usedAt: null },
    select: { id: true },
  });
  if (!row) {
    return { error: "Código no encontrado o ya usado." as const };
  }

  await prisma.signupInviteCode.delete({ where: { id: row.id } });
  return { ok: true as const };
}
