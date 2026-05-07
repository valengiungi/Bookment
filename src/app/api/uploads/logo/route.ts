import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo faltante" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Formato inválido. Usá PNG, JPG, WEBP o GIF." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "El logo supera 2MB." }, { status: 400 });
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1] ?? "png";
  const filename = `${session.user.tenantId}-${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`logos/${filename}`, file, { access: "public" });
    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: { logoUrl: blob.url },
    });
    return NextResponse.json({ ok: true, url: blob.url });
  }

  if (process.env.VERCEL === "1") {
    return NextResponse.json(
      {
        error:
          "En Vercel los archivos no se pueden guardar en disco. Creá un Blob Store en el proyecto (Storage → Blob) para obtener BLOB_READ_WRITE_TOKEN, o cargalo en Environment Variables.",
      },
      { status: 503 },
    );
  }

  const relative = path.join("uploads", "logos", filename);
  const target = path.join(process.cwd(), "public", relative);

  await mkdir(path.dirname(target), { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(target, bytes);

  const url = `/${relative.replaceAll("\\", "/")}`;
  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { logoUrl: url },
  });

  return NextResponse.json({ ok: true, url });
}
