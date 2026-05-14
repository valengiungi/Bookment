import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { BookingStatus } from "@/generated/prisma";
import { getDashboardActor, getEmployeeStaffId, isEmployeeRole } from "@/lib/dashboard-actor";
import { prisma } from "@/lib/prisma";
import { getEffectivePlanId } from "@/lib/plans";
import { defaultTimeZone } from "@/lib/timezone";
import { EditBookingForm } from "./edit-booking-form";

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  const userId = session?.user?.id;
  if (!tenantId || !userId) redirect("/login");
  const actor = await getDashboardActor(userId, tenantId);
  if (!actor) redirect("/login");
  const employeeStaffId = getEmployeeStaffId(actor);
  if (isEmployeeRole(actor.role) && !employeeStaffId) {
    redirect("/dashboard");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { subscriptionTier: true, sameServicesAllStaff: true },
  });
  if (!tenant) redirect("/login");
  if (getEffectivePlanId(tenant.subscriptionTier) !== "premium") {
    redirect("/dashboard");
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      tenantId,
      status: BookingStatus.CONFIRMED,
      ...(employeeStaffId ? { staffId: employeeStaffId } : {}),
    },
    include: { service: true, staff: true },
  });
  if (!booking) notFound();

  const [services, staff] = await Promise.all([
    prisma.service.findMany({
      where: employeeStaffId
        ? tenant.sameServicesAllStaff
          ? { tenantId, active: true }
          : {
              tenantId,
              active: true,
              staffAssignments: { some: { staffId: employeeStaffId } },
            }
        : { tenantId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.staff.findMany({
      where: employeeStaffId
        ? { tenantId, active: true, id: employeeStaffId }
        : { tenantId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  let staffIdsByService: Record<string, string[]> | null = null;
  if (!tenant.sameServicesAllStaff) {
    const links = await prisma.staffService.findMany({
      where: { service: { tenantId } },
      select: { serviceId: true, staffId: true },
    });
    staffIdsByService = {};
    for (const l of links) {
      if (!staffIdsByService[l.serviceId]) staffIdsByService[l.serviceId] = [];
      staffIdsByService[l.serviceId].push(l.staffId);
    }
  }

  const tz = defaultTimeZone;
  const startsLocal = formatInTimeZone(booking.startsAt, tz, "yyyy-MM-dd'T'HH:mm");

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm font-medium text-teal-700 hover:underline">
          ← Volver al resumen
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Editar turno</h1>
        <p className="mt-1 text-sm text-slate-600">
          {booking.customerName} · {booking.customerPhone}
        </p>
      </div>

      <EditBookingForm
        bookingId={booking.id}
        initialServiceId={booking.serviceId}
        initialStaffId={booking.staffId}
        initialStartsLocal={startsLocal}
        services={services}
        staff={staff}
        sameServicesAllStaff={tenant.sameServicesAllStaff}
        staffIdsByService={staffIdsByService}
        staffLocked={!!employeeStaffId}
      />
    </div>
  );
}
