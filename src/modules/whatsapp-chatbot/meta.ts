export type IncomingMetaTextMessage = {
  from: string;
  text: string;
  messageId: string | null;
};

type MetaWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from?: string;
          id?: string;
          type?: string;
          text?: {
            body?: string;
          };
        }>;
      };
    }>;
  }>;
};

export function getWhatsAppWebhookVerifyToken() {
  return process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim() ?? "";
}

export function isWhatsAppSendConfigured() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
  );
}

export function extractIncomingMetaTextMessages(
  payload: MetaWebhookPayload,
): IncomingMetaTextMessage[] {
  const messages: IncomingMetaTextMessage[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        if (message.type !== "text" || !message.from || !message.text?.body) {
          continue;
        }

        messages.push({
          from: message.from,
          text: message.text.body,
          messageId: message.id ?? null,
        });
      }
    }
  }

  return messages;
}

export async function sendWhatsAppTextMessage(args: { to: string; body: string }) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!accessToken || !phoneNumberId) {
    return { ok: false as const, skipped: true as const };
  }

  const response = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: args.to.replace(/\D/g, ""),
      type: "text",
      text: {
        body: args.body,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return { ok: false as const, skipped: false as const, error: body };
  }

  return { ok: true as const, skipped: false as const };
}
