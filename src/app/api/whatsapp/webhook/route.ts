import { NextResponse } from "next/server";
import {
  extractIncomingMetaTextMessages,
  getWhatsAppWebhookVerifyToken,
  isWhatsAppSendConfigured,
  sendWhatsAppTextMessage,
} from "@/modules/whatsapp-chatbot/meta";
import { handleIncomingWhatsAppText } from "@/modules/whatsapp-chatbot/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === getWhatsAppWebhookVerifyToken() && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Webhook no verificado." }, { status: 403 });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const preview =
    request.headers.get("x-bookment-preview") === "1" ||
    new URL(request.url).searchParams.get("preview") === "1";
  const incomingMessages = extractIncomingMetaTextMessages(payload);

  const results = [];
  for (const message of incomingMessages) {
    const chatbotReply = await handleIncomingWhatsAppText({
      fromPhone: message.from,
      text: message.text,
    });

    const sendResult = isWhatsAppSendConfigured()
      ? await sendWhatsAppTextMessage({
          to: chatbotReply.phoneNumber,
          body: chatbotReply.replyText,
        })
      : { ok: false as const, skipped: true as const };

    results.push({
      messageId: message.messageId,
      from: chatbotReply.phoneNumber,
      outcome: chatbotReply.outcome,
      detectedIntent: chatbotReply.detectedIntent,
      sent: sendResult.ok,
      skipped: sendResult.skipped,
      error: "error" in sendResult ? sendResult.error : null,
      replyText: chatbotReply.replyText,
    });
  }

  if (preview) {
    return NextResponse.json({
      received: true,
      configured: isWhatsAppSendConfigured(),
      processed: results.length,
      results,
    });
  }

  return NextResponse.json({
    received: true,
    processed: results.length,
  });
}
