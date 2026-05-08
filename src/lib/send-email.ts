type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/** Resend opcional: sin API key solo devuelve skipped (no lanza). */
export async function sendTransactionalEmail(input: SendEmailInput): Promise<{
  sent: boolean;
  skipped?: boolean;
}> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.info("[sendTransactionalEmail] Sin RESEND_API_KEY; correo no enviado.", {
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
