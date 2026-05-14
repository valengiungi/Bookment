import type { Role } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export type DashboardActor = {
  id: string;
  tenantId: string;
  role: Role;
  staffProfile: {
    id: string;
    name: string;
    active: boolean;
  } | null;
};

export async function getDashboardActor(
  userId: string | null | undefined,
  tenantId: string | null | undefined,
) {
  if (!userId || !tenantId) {
    return null;
  }

  return prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: {
      id: true,
      tenantId: true,
      role: true,
      staffProfile: {
        select: {
          id: true,
          name: true,
          active: true,
        },
      },
    },
  }) as Promise<DashboardActor | null>;
}

export function isEmployeeRole(role: Role | null | undefined) {
  return role === "EMPLOYEE";
}

export function getEmployeeStaffId(actor: DashboardActor | null) {
  if (!actor || actor.role !== "EMPLOYEE" || !actor.staffProfile?.active) {
    return null;
  }

  return actor.staffProfile.id;
}
