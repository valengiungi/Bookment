import type { NextAuthConfig } from "next-auth";

/**
 * Solo lo que necesita el middleware (Edge). Sin Credentials ni Prisma —
 * evita superar el límite de 1 MB de Vercel Hobby.
 */
export default {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role =
          (token.role as "SUPER_ADMIN" | "OWNER" | "EMPLOYEE" | undefined) ?? "EMPLOYEE";
        session.user.tenantId = (token.tenantId as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
