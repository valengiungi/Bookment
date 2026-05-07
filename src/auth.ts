import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { withDbRetry } from "@/lib/db-retry";
import authConfig from "./auth.config";

const credentialsSchema = z.object({
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z.string().email(),
  ),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse({
          email: typeof raw?.email === "string" ? raw.email : "",
          password: typeof raw?.password === "string" ? raw.password : "",
        });
        if (!parsed.success) return null;

        const email = parsed.data.email;
        const { prisma } = await import("@/lib/prisma");

        const user = await withDbRetry(() =>
          prisma.user.findUnique({ where: { email } }),
        );
        if (!user?.passwordHash) return null;
        const ok = await compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
          tenantId: user.tenantId,
        };
      },
    }),
  ],
});
