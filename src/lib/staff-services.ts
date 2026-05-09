import type { PrismaClient } from "@/generated/prisma";

/** Crea todas las combinaciones staff×servicio activos (al pasar a modo por profesional). */
export async function seedFullStaffServiceMatrix(
  prisma: PrismaClient,
  tenantId: string,
) {
  const [staff, services] = await Promise.all([
    prisma.staff.findMany({
      where: { tenantId, active: true },
      select: { id: true },
    }),
    prisma.service.findMany({
      where: { tenantId, active: true },
      select: { id: true },
    }),
  ]);
  const data = staff.flatMap((s) =>
    services.map((svc) => ({ staffId: s.id, serviceId: svc.id })),
  );
  if (!data.length) return;
  await prisma.staffService.createMany({ data, skipDuplicates: true });
}

/** Enlaza un servicio recién creado o reactivado con todos los profesionales activos. */
export async function linkServiceToAllStaffInPerStaffMode(
  prisma: PrismaClient,
  tenantId: string,
  serviceId: string,
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { sameServicesAllStaff: true },
  });
  if (!tenant || tenant.sameServicesAllStaff) return;

  const staff = await prisma.staff.findMany({
    where: { tenantId, active: true },
    select: { id: true },
  });
  if (!staff.length) return;
  await prisma.staffService.createMany({
    data: staff.map((s) => ({ staffId: s.id, serviceId })),
    skipDuplicates: true,
  });
}

/** Enlaza todos los servicios activos a un profesional nuevo (modo por profesional). */
export async function linkNewStaffToAllServices(
  prisma: PrismaClient,
  tenantId: string,
  staffId: string,
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { sameServicesAllStaff: true },
  });
  if (!tenant || tenant.sameServicesAllStaff) return;

  const services = await prisma.service.findMany({
    where: { tenantId, active: true },
    select: { id: true },
  });
  if (!services.length) return;
  await prisma.staffService.createMany({
    data: services.map((svc) => ({ staffId, serviceId: svc.id })),
    skipDuplicates: true,
  });
}

export async function staffOffersService(
  prisma: PrismaClient,
  tenantId: string,
  sameServicesAllStaff: boolean,
  staffId: string,
  serviceId: string,
): Promise<boolean> {
  if (sameServicesAllStaff) return true;
  const [link, service, staff] = await Promise.all([
    prisma.staffService.findUnique({
      where: { staffId_serviceId: { staffId, serviceId } },
    }),
    prisma.service.findFirst({
      where: { id: serviceId, tenantId, active: true },
      select: { id: true },
    }),
    prisma.staff.findFirst({
      where: { id: staffId, tenantId, active: true },
      select: { id: true },
    }),
  ]);
  return !!(link && service && staff);
}
