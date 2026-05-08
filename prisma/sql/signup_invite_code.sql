-- Ejecutar en Supabase → SQL Editor si no podés usar `npx prisma db push`
-- contra la base de producción.

CREATE TABLE IF NOT EXISTS "SignupInviteCode" (
  "id" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "usedAt" TIMESTAMP(3),
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SignupInviteCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SignupInviteCode_codeHash_key" ON "SignupInviteCode"("codeHash");

CREATE INDEX IF NOT EXISTS "SignupInviteCode_usedAt_idx" ON "SignupInviteCode"("usedAt");
