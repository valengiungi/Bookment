type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Envío transaccional vía Resend. En desarrollo sin RESEND_API_KEY solo registra en consola.
 * Producción: configurar RESEND_API_KEY y RESEND_FROM (ej. "Bookment <notificaciones@tudominio.com>").
 */
export async function sendTransactionalEmail(input: SendEmailInput): Promise<{
  sent: boolean;
  skipped?: boolean;
}> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Falta RESEND_API_KEY. Configurá Resend en Vercel para enviar correos de verificación.",
      );
    }
    console.info("[sendTransactionalEmail] sin RESEND_API_KEY — simulación:", {
      to: input.to,
      subject: input.subject,
    });
    return { sent: false, skipped: true };
  }

  const from =
    process.env.RESEND_FROM?.trim() ?? "Bookment <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${errText || res.statusText}`);
  }

  return { sent: true };
}
