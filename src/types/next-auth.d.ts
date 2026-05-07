import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      tenantId?: string | null;
    };
  }

  interface User {
    role: Role;
    tenantId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    tenantId?: string | null;
  }
}
