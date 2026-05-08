import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import authConfig from "./auth.config";

const credentialsSchema = z.object({
  email: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.string().min(1).email()),
  password: z.string().min(1),
});

function pickCredentials(raw: unknown): { email: string; password: string } {
  if (!raw || typeof raw !== "object") {
    return { email: "", password: "" };
  }
  const o = raw as Record<string, unknown>;
  return {
    email: typeof o.email === "string" ? o.email : "",
    password: typeof o.password === "string" ? o.password : "",
  };
}

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
        const { email: emailRaw, password: passwordRaw } = pickCredentials(raw);
        const parsed = credentialsSchema.safeParse({
          email: emailRaw,
          password: passwordRaw,
        });
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const { prisma } = await import("@/lib/prisma");

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) {
          return null;
        }

        try {
          const ok = await compare(password, user.passwordHash);
          if (!ok) return null;
        } catch {
          return null;
        }

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
