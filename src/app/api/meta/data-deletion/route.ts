import { createHmac, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

function parseSignedRequest(signedRequest: string) {
  const [encodedSig, encodedPayload] = signedRequest.split(".", 2);
  if (!encodedSig || !encodedPayload) {
    return null;
  }

  const payloadBuffer = base64UrlDecode(encodedPayload);
  const payloadText = payloadBuffer.toString("utf8");
  const payload = JSON.parse(payloadText) as Record<string, unknown>;
  const appSecret = process.env.META_APP_SECRET?.trim();

  if (appSecret) {
    const expectedSig = createHmac("sha256", appSecret).update(encodedPayload).digest();
    const actualSig = base64UrlDecode(encodedSig);
    if (!expectedSig.equals(actualSig)) {
      return null;
    }
  }

  return payload;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  return NextResponse.json(
    {
      ok: true,
      message: code
        ? "Solicitud de eliminación registrada."
        : "Endpoint de eliminación de datos de Bookment activo.",
      confirmation_code: code ?? null,
    },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const signedRequest = String(formData?.get("signed_request") ?? "").trim();
  const parsed = signedRequest ? parseSignedRequest(signedRequest) : null;
  const confirmationCode = randomUUID().replace(/-/g, "").slice(0, 12);
  const statusUrl = new URL("/data-deletion", request.url);
  statusUrl.searchParams.set("code", confirmationCode);

  return NextResponse.json(
    {
      url: statusUrl.toString(),
      confirmation_code: confirmationCode,
      received: Boolean(parsed),
    },
    { status: 200 },
  );
}
