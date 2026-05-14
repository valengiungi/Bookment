"use server";

import { revalidatePath } from "next/cache";
import { formatInTimeZone } from "date-fns-tz";
import { redirect, RedirectType } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { auth, signOut } from "@/auth";
import { BlockReason, BookingStatus, Role, TenantExpenseKind } from "@/generated/prisma";
import { getDashboardActor, getEmployeeStaffId, isEmployeeRole } from "@/lib/dashboard-actor";
import { prisma } from "@/lib/prisma";
import { getEffectivePlanId } from "@/lib/plans";
import { canCreateService, canCreateStaff, canUseWhatsAppChatbot } from "@/lib/plan-limits";
import { updateBooking as updateBookingCore } from "@/modules/booking/update-booking";
import { parseDatetimeLocalToUtc } from "@/lib/datetime-local";
import { defaultTimeZone } from "@/lib/timezone";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp-phone";
import {
  linkNewStaffToAllServices,
  linkServiceToAllStaffInPerStaffMode,
  seedFullStaffServiceMatrix,
} from "@/lib/staff-services";

function readBlockRange(formData: FormData, dateKey: string, timeKey: string, tz: string) {
  const d = String(formData.get(dateKey) ?? "").trim();
  const t = String(formData.get(timeKey) ?? "").trim();
  if (!d || !t) return null;
  return parseDatetimeLocalToUtc(`${d}T${t}`, tz);
}

const staffAccessSchema = z.object({
  staffId: z.string().trim().min(1),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string(),
  whatsappNumber: z.string().trim().max(40),
});

const expenseSchema = z.object({
  name: z.string().trim().min(2).max(120),
  kind: z.enum(["FIXED_ONE_TIME", "FIXED_MONTHLY", "DYNAMIC"] as const),
  amountArs: z.coerce.number().int().positive(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(600).optional(),
});

export type InlineFormState = {
  tone: "idle" | "success" | "error" | "warning";
  text: string | null;
};

export type StaffAccessFormState = InlineFormState;
export type AccountWhatsappFormState = InlineFormState;
export type TenantWhatsappChatbotFormState = InlineFormState;

async function getActionActor() {
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) {
    return null;
  }

  return getDashboardActor(session.user.id, session.user.tenantId);
}

export async function cancelBooking(bookingId: string) {
  const actor = await getActionActor();
  if (!actor) return;
  const employeeStaffId = getEmployeeStaffId(actor);
  if (isEmployeeRole(actor.role) && !employeeStaffId) return;

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      tenantId: actor.tenantId,
      ...(employeeStaffId ? { staffId: employeeStaffId } : {}),
    },
  });
  if (!booking) return;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");
}

export async function updateBookingFromDashboard(formData: FormData) {
  const actor = await getActionActor();
  if (!actor) {
    return { ok: false as const, message: "No autorizado" };
  }
  const employeeStaffId = getEmployeeStaffId(actor);
  if (isEmployeeRole(actor.role) && !employeeStaffId) {
    return { ok: false as const, message: "Tu perfil no está disponible." };
  }

  const tenantId = actor.tenantId;
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { subscriptionTier: true },
  });
  if (getEffectivePlanId(tenant?.subscriptionTier ?? "simple") !== "premium") {
    return { ok: false as const, message: "Disponible en plan Premium." };
  }

  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const staffId = employeeStaffId ?? String(formData.get("staffId") ?? "").trim();
  const startsLocal = String(formData.get("startsAt") ?? "").trim();
  if (!bookingId || !serviceId || !staffId || !startsLocal) {
    return { ok: false as const, message: "Completá todos los campos." };
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      tenantId,
      status: BookingStatus.CONFIRMED,
      ...(employeeStaffId ? { staffId: employeeStaffId } : {}),
    },
    select: { id: true },
  });
  if (!booking) {
    return { ok: false as const, message: "No encontramos ese turno." };
  }

  const tz = defaultTimeZone;
  const startsAt = parseDatetimeLocalToUtc(startsLocal, tz);
  if (!startsAt) {
    return { ok: false as const, message: "Fecha u hora inválida." };
  }

  const result = await updateBookingCore({
    bookingId,
    tenantId,
    serviceId,
    staffId,
    startsAt,
    timeZone: tz,
  });

  if (!result.ok) {
    const map: Record<string, string> = {
      BOOKING_NOT_FOUND: "No encontramos ese turno.",
      SERVICE_NOT_FOUND: "Servicio no disponible.",
      STAFF_NOT_FOUND: "Profesional no disponible.",
      SERVICE_STAFF_MISMATCH: "Ese profesional no ofrece el servicio elegido.",
      CLOSED_DAY: "Ese día está cerrado en el horario configurado.",
      OUTSIDE_HOURS: "La hora queda fuera del horario de trabajo.",
      DOUBLE_BOOK: "Ya hay otro turno en ese horario.",
      BLOCKED: "Ese horario está bloqueado.",
    };
    return { ok: false as const, message: map[result.code] ?? "No se pudo guardar." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");
  revalidatePath(`/dashboard/bookings/${bookingId}/edit`);
  const ymd = formatInTimeZone(startsAt, tz, "yyyy-MM-dd");
  const monthKey = ymd.slice(0, 7);
  return {
    ok: true as const,
    redirectTo: `/dashboard?month=${monthKey}&date=${ymd}`,
  };
}

export async function createBlock(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect("/dashboard/blocks?blockMsg=auth");
  }

  const tz = defaultTimeZone;
  const startsAt = readBlockRange(formData, "startsAtDate", "startsAtTime", tz);
  const endsAt = readBlockRange(formData, "endsAtDate", "endsAtTime", tz);
  const reasonRaw = String(formData.get("reason") ?? "MANUAL");
  const reason = (
    ["MANUAL", "VACATION", "HOLIDAY"] as const
  ).includes(reasonRaw as BlockReason)
    ? (reasonRaw as BlockReason)
    : BlockReason.MANUAL;
  const staffIdRaw = formData.get("staffId");
  const staffId =
    staffIdRaw && String(staffIdRaw) !== "" ? String(staffIdRaw) : null;

  if (!startsAt || !endsAt) {
    redirect("/dashboard/blocks?blockMsg=fecha");
  }
  if (endsAt <= startsAt) {
    redirect("/dashboard/blocks?blockMsg=rango");
  }

  if (staffId) {
    const s = await prisma.staff.findFirst({
      where: { id: staffId, tenantId: session.user.tenantId },
      select: { id: true },
    });
    if (!s) {
      redirect("/dashboard/blocks?blockMsg=staff");
    }
  }

  await prisma.blockedSlot.create({
    data: {
      tenantId: session.user.tenantId,
      staffId,
      startsAt,
      endsAt,
      reason,
    },
  });

  revalidatePath("/dashboard/blocks");
  redirect("/dashboard/blocks?blockMsg=ok");
}

export async function updateBlock(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect("/dashboard/blocks?blockMsg=auth");
  }

  const blockId = String(formData.get("blockId") ?? "");
  if (!blockId) {
    redirect("/dashboard/blocks?blockMsg=id");
  }

  const tz = defaultTimeZone;
  const startsAt = readBlockRange(formData, "startsAtDate", "startsAtTime", tz);
  const endsAt = readBlockRange(formData, "endsAtDate", "endsAtTime", tz);
  const reasonRaw = String(formData.get("reason") ?? "MANUAL");
  const reason = (
    ["MANUAL", "VACATION", "HOLIDAY"] as const
  ).includes(reasonRaw as BlockReason)
    ? (reasonRaw as BlockReason)
    : BlockReason.MANUAL;
  const staffIdRaw = formData.get("staffId");
  const staffId =
    staffIdRaw && String(staffIdRaw) !== "" ? String(staffIdRaw) : null;

  if (!startsAt || !endsAt) {
    redirect("/dashboard/blocks?blockMsg=fecha");
  }
  if (endsAt <= startsAt) {
    redirect("/dashboard/blocks?blockMsg=rango");
  }

  if (staffId) {
    const s = await prisma.staff.findFirst({
      where: { id: staffId, tenantId: session.user.tenantId },
      select: { id: true },
    });
    if (!s) {
      redirect("/dashboard/blocks?blockMsg=staff");
    }
  }

  const row = await prisma.blockedSlot.findFirst({
    where: { id: blockId, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!row) {
    redirect("/dashboard/blocks?blockMsg=notfound");
  }

  await prisma.blockedSlot.update({
    where: { id: blockId },
    data: { startsAt, endsAt, reason, staffId },
  });

  revalidatePath("/dashboard/blocks");
  redirect("/dashboard/blocks?blockMsg=ok");
}

export async function deleteBlock(blockId: string) {
  const session = await auth();
  if (!session?.user?.tenantId) return;

  const row = await prisma.blockedSlot.findFirst({
    where: { id: blockId, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!row) return;

  await prisma.blockedSlot.delete({ where: { id: blockId } });
  revalidatePath("/dashboard/blocks");
}

export async function createService(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { subscriptionTier: true },
  });
  if (!tenant) return;
  if (!(await canCreateService(session.user.tenantId, tenant.subscriptionTier))) {
    redirect("/dashboard/services?planLimit=servicios");
  }

  const name = String(formData.get("name") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes"));
  const price = formData.get("priceAmount");
  const parsedPrice =
    price === null || String(price).trim() === ""
      ? null
      : Number(String(price).replace(",", "."));
  const priceCents =
    parsedPrice === null || !Number.isFinite(parsedPrice)
      ? null
      : Math.round(parsedPrice * 100);

  if (name.length < 2) return;
  if (!Number.isFinite(durationMinutes) || durationMinutes < 5) return;
  if (price !== null && String(price).trim() !== "" && priceCents === null) return;

  const created = await prisma.service.create({
    data: {
      tenantId: session.user.tenantId,
      name,
      durationMinutes,
      priceCents: priceCents ?? null,
    },
  });
  await linkServiceToAllStaffInPerStaffMode(prisma, session.user.tenantId, created.id);

  revalidatePath("/dashboard/services");
}

export async function updateService(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) return;

  const serviceId = String(formData.get("serviceId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes"));
  const price = formData.get("priceAmount");
  const parsedPrice =
    price === null || String(price).trim() === ""
      ? null
      : Number(String(price).replace(",", "."));
  const priceCents =
    parsedPrice === null || !Number.isFinite(parsedPrice)
      ? null
      : Math.round(parsedPrice * 100);

  if (!serviceId || name.length < 2) return;
  if (!Number.isFinite(durationMinutes) || durationMinutes < 5) return;
  if (price !== null && String(price).trim() !== "" && priceCents === null) return;

  const row = await prisma.service.findFirst({
    where: { id: serviceId, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!row) return;

  await prisma.service.update({
    where: { id: row.id },
    data: {
      name,
      durationMinutes,
      priceCents: priceCents ?? null,
    },
  });

  revalidatePath("/dashboard/services");
}

export async function toggleServiceActive(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) return;

  const serviceId = String(formData.get("serviceId") ?? "");
  const active = String(formData.get("active") ?? "false") === "true";
  if (!serviceId) return;

  const row = await prisma.service.findFirst({
    where: { id: serviceId, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!row) return;

  await prisma.service.update({
    where: { id: row.id },
    data: { active },
  });

  if (active) {
    await linkServiceToAllStaffInPerStaffMode(prisma, session.user.tenantId, row.id);
  }

  revalidatePath("/dashboard/services");
}

export async function deleteServicePermanently(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) return;

  const serviceId = String(formData.get("serviceId") ?? "");
  if (!serviceId) return;

  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!service) return;

  // Eliminación definitiva: borra historial ligado a ese servicio.
  const bookings = await prisma.booking.findMany({
    where: { serviceId: service.id, tenantId: session.user.tenantId },
    select: { id: true },
  });
  const bookingIds = bookings.map((b) => b.id);

  await prisma.$transaction(async (tx) => {
    if (bookingIds.length) {
      await tx.reminderJob.deleteMany({ where: { bookingId: { in: bookingIds } } });
      await tx.booking.deleteMany({ where: { id: { in: bookingIds } } });
    }
    await tx.service.delete({ where: { id: service.id } });
  });

  revalidatePath("/dashboard/services");
}

export async function setServicesAssignmentMode(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) return;

  const raw = String(formData.get("sameServicesAllStaff") ?? "").toLowerCase();
  const sameServicesAllStaff = raw === "true" || raw === "1" || raw === "on";

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { sameServicesAllStaff },
  });

  if (!sameServicesAllStaff) {
    await seedFullStaffServiceMatrix(prisma, session.user.tenantId);
  } else {
    await prisma.staffService.deleteMany({
      where: { staff: { tenantId: session.user.tenantId } },
    });
  }

  revalidatePath("/dashboard/services");
}

export async function updateStaffServiceAssignments(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const staffId = String(formData.get("staffId") ?? "").trim();
  if (!staffId) {
    redirect("/dashboard/services?staffServices=err");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { sameServicesAllStaff: true },
  });
  if (!tenant || tenant.sameServicesAllStaff) {
    redirect("/dashboard/services?staffServices=mode");
  }

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId: session.user.tenantId, active: true },
    select: { id: true },
  });
  if (!staff) {
    redirect("/dashboard/services?staffServices=err");
  }

  const requestedIds = formData.getAll("serviceId").map(String).filter(Boolean);
  const valid =
    requestedIds.length === 0
      ? []
      : await prisma.service.findMany({
          where: {
            tenantId: session.user.tenantId,
            id: { in: requestedIds },
            active: true,
          },
          select: { id: true },
        });
  const ids = valid.map((s) => s.id);

  await prisma.$transaction(async (tx) => {
    await tx.staffService.deleteMany({ where: { staffId } });
    if (ids.length > 0) {
      await tx.staffService.createMany({
        data: ids.map((serviceId) => ({ staffId, serviceId })),
      });
    }
  });

  revalidatePath("/dashboard/services");
  redirect("/dashboard/services?staffServices=ok", RedirectType.push);
}

export async function createStaff(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.role !== "OWNER") return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { subscriptionTier: true },
  });
  if (!tenant) return;
  if (!(await canCreateStaff(session.user.tenantId, tenant.subscriptionTier))) {
    redirect("/dashboard/settings?planLimit=staff");
  }

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return;

  const created = await prisma.staff.create({
    data: { tenantId: session.user.tenantId, name },
  });
  await linkNewStaffToAllServices(prisma, session.user.tenantId, created.id);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/services");
}

export async function updateStaff(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.role !== "OWNER") return;

  const staffId = String(formData.get("staffId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!staffId || name.length < 2) return;

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId: session.user.tenantId },
    select: { id: true, userId: true },
  });
  if (!staff) return;

  await prisma.$transaction(async (tx) => {
    await tx.staff.update({
      where: { id: staff.id },
      data: { name },
    });

    if (staff.userId) {
      await tx.user.update({
        where: { id: staff.userId },
        data: { name },
      });
    }
  });

  revalidatePath("/dashboard/settings");
}

export async function deleteStaff(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.role !== "OWNER") return;

  const staffId = String(formData.get("staffId") ?? "");
  if (!staffId) return;

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!staff) return;

  // Eliminación segura: desactivar profesional para no romper historial/agenda.
  await prisma.staff.update({
    where: { id: staff.id },
    data: { active: false },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/hours");
}

export async function reactivateStaff(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.role !== "OWNER") return;

  const staffId = String(formData.get("staffId") ?? "");
  if (!staffId) return;

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!staff) return;

  await prisma.staff.update({
    where: { id: staff.id },
    data: { active: true },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/hours");
}

export async function permanentlyDeleteStaff(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.role !== "OWNER") return;

  const staffId = String(formData.get("staffId") ?? "");
  if (!staffId) return;

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId: session.user.tenantId },
    select: { id: true, active: true, userId: true },
  });
  if (!staff || staff.active) {
    redirect("/dashboard/settings?staffPurge=forbidden");
  }

  const bookingCount = await prisma.booking.count({
    where: { tenantId: session.user.tenantId, staffId: staff.id },
  });
  if (bookingCount > 0) {
    redirect("/dashboard/settings?staffPurge=bookings");
  }

  await prisma.$transaction(async (tx) => {
    await tx.staff.delete({ where: { id: staff.id } });
    if (staff.userId) {
      await tx.user.deleteMany({
        where: {
          id: staff.userId,
          tenantId: session.user.tenantId,
          role: Role.EMPLOYEE,
        },
      });
    }
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/hours");
}

export async function upsertStaffAccess(
  _prevState: StaffAccessFormState,
  formData: FormData,
): Promise<StaffAccessFormState> {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.role !== "OWNER") {
    return {
      tone: "error",
      text: "No tenés permiso para gestionar accesos de profesionales.",
    };
  }

  const rawStaffId = String(formData.get("staffId") ?? "").trim();
  const rawEmail = String(formData.get("email") ?? "").trim();
  const rawPassword = String(formData.get("password") ?? "");
  const rawWhatsappNumber = String(formData.get("whatsappNumber") ?? "").trim();

  if (!rawStaffId) {
    return {
      tone: "error",
      text: "No encontramos ese profesional.",
    };
  }

  const parsed = staffAccessSchema.safeParse({
    staffId: rawStaffId,
    email: rawEmail,
    password: rawPassword,
    whatsappNumber: rawWhatsappNumber,
  });
  if (!parsed.success) {
    const hasInvalidEmail = parsed.error.issues.some((issue) => issue.path.includes("email"));
    return {
      tone: "warning",
      text: hasInvalidEmail
        ? "Ingresá un email válido para el profesional."
        : "Revisá el email y la contraseña ingresados.",
    };
  }

  const { staffId, email, password, whatsappNumber } = parsed.data;
  const tenantId = session.user.tenantId;
  const normalizedWhatsapp = normalizeWhatsAppNumber(whatsappNumber);
  if (!normalizedWhatsapp.ok) {
    return {
      tone: "warning",
      text: normalizedWhatsapp.message,
    };
  }

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId },
    select: {
      id: true,
      name: true,
      userId: true,
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });
  if (!staff) {
    return {
      tone: "error",
      text: "No encontramos ese profesional.",
    };
  }

  const emailOwner = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (emailOwner && emailOwner.id !== staff.userId) {
    return {
      tone: "error",
      text: "Ese email ya está en uso por otra cuenta.",
    };
  }

  const whatsappNumberValue = normalizedWhatsapp.value;
  if (whatsappNumberValue) {
    const whatsappOwner = await prisma.user.findUnique({
      where: { whatsappNumber: whatsappNumberValue },
      select: { id: true },
    });
    if (whatsappOwner && whatsappOwner.id !== staff.userId) {
      return {
        tone: "error",
        text: "Ese número de WhatsApp ya está vinculado a otra cuenta.",
      };
    }
  }

  const shouldUpdatePassword = password.trim().length > 0;
  const linkedAtValue = whatsappNumberValue ? new Date() : null;
  if (!staff.userId && !shouldUpdatePassword) {
    return {
      tone: "warning",
      text: "Para crear la cuenta del profesional tenés que definir una contraseña.",
    };
  }
  if (!staff.userId && password.trim().length < 8) {
    return {
      tone: "warning",
      text: "La contraseña debe tener al menos 8 caracteres.",
    };
  }
  if (shouldUpdatePassword && password.trim().length < 8) {
    return {
      tone: "warning",
      text: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  const passwordHash = shouldUpdatePassword ? await hash(password.trim(), 10) : null;

  try {
    if (staff.userId) {
      await prisma.user.update({
        where: { id: staff.userId },
        data: {
          email,
          emailVerified: new Date(),
          name: staff.name,
          role: Role.EMPLOYEE,
          tenantId,
          whatsappNumber: whatsappNumberValue,
          whatsappLinkedAt: linkedAtValue,
          ...(passwordHash ? { passwordHash } : {}),
        },
      });

      revalidatePath("/dashboard/settings");
      return {
        tone: "success",
        text: "Acceso actualizado correctamente.",
      };
    }

    await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          emailVerified: new Date(),
          passwordHash: passwordHash!,
          name: staff.name,
          role: Role.EMPLOYEE,
          tenantId,
          whatsappNumber: whatsappNumberValue,
          whatsappLinkedAt: linkedAtValue,
        },
      });

      await tx.staff.update({
        where: { id: staff.id },
        data: { userId: createdUser.id },
      });
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return {
        tone: "error",
        text: "Ese email o número de WhatsApp ya está en uso por otra cuenta.",
      };
    }
    return {
      tone: "error",
      text: "No se pudo crear la cuenta del profesional. Probá de nuevo.",
    };
  }

  revalidatePath("/dashboard/settings");
  return {
    tone: "success",
    text: "Acceso creado correctamente.",
  };
}

export async function updateWorkingHours(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) return;

  const tenantId = session.user.tenantId;
  const staffIdRaw = String(formData.get("staffId") ?? "__GENERAL__");
  const staffId = staffIdRaw === "__GENERAL__" ? null : staffIdRaw;

  if (staffId) {
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, tenantId, active: true },
      select: { id: true },
    });
    if (!staff) return;
  }

  const rows: { dayOfWeek: number; opensAt: string; closesAt: string }[] = [];
  const mode = String(formData.get("mode") ?? "full");
  const hmRegex = /^\d{2}:\d{2}$/;

  if (mode === "compact") {
    const openDaysCsv = String(formData.get("openDaysCsv") ?? "");
    const opensAt = String(formData.get("opensAt") ?? "");
    const closesAt = String(formData.get("closesAt") ?? "");
    if (!hmRegex.test(opensAt) || !hmRegex.test(closesAt)) return;
    if (closesAt <= opensAt) return;
    const openDays = openDaysCsv
      .split(",")
      .map((x) => Number(x))
      .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
    for (const day of openDays) {
      rows.push({ dayOfWeek: day, opensAt, closesAt });
    }
  } else {
    for (let day = 0; day <= 6; day += 1) {
      const enabled = formData.get(`open_${day}`) === "on";
      if (!enabled) continue;
      const opensAt = String(formData.get(`opensAt_${day}`) ?? "");
      const closesAt = String(formData.get(`closesAt_${day}`) ?? "");
      if (!hmRegex.test(opensAt) || !hmRegex.test(closesAt)) continue;
      if (closesAt <= opensAt) continue;
      rows.push({ dayOfWeek: day, opensAt, closesAt });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.workingHour.deleteMany({ where: { tenantId, staffId } });
    if (rows.length) {
      await tx.workingHour.createMany({
        data: rows.map((r) => ({
          tenantId,
          staffId,
          dayOfWeek: r.dayOfWeek,
          opensAt: r.opensAt,
          closesAt: r.closesAt,
        })),
      });
    }
  });

  revalidatePath("/dashboard/hours");
}

export async function updateTenantWhatsapp(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) return;

  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  if (whatsapp.length < 8 || whatsapp.length > 32) return;

  await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: { whatsapp },
  });

  revalidatePath("/dashboard/settings");
}

export async function updateAccountWhatsapp(
  _prevState: AccountWhatsappFormState,
  formData: FormData,
): Promise<AccountWhatsappFormState> {
  const session = await auth();
  if (!session?.user?.id || !session.user.tenantId) {
    return {
      tone: "error",
      text: "No autorizado.",
    };
  }

  const rawWhatsappNumber = String(formData.get("whatsappNumber") ?? "").trim();
  const normalizedWhatsapp = normalizeWhatsAppNumber(rawWhatsappNumber);
  if (!normalizedWhatsapp.ok) {
    return {
      tone: "warning",
      text: normalizedWhatsapp.message,
    };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        whatsappNumber: normalizedWhatsapp.value,
        whatsappLinkedAt: normalizedWhatsapp.value ? new Date() : null,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return {
        tone: "error",
        text: "Ese número de WhatsApp ya está vinculado a otra cuenta.",
      };
    }
    throw error;
  }

  revalidatePath("/dashboard/settings");
  return {
    tone: "success",
    text: normalizedWhatsapp.value
      ? "Número de WhatsApp vinculado correctamente."
      : "Vinculación de WhatsApp eliminada.",
  };
}

export async function setTenantWhatsappChatbotMode(
  _prevState: TenantWhatsappChatbotFormState,
  formData: FormData,
): Promise<TenantWhatsappChatbotFormState> {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.role !== "OWNER") {
    return {
      tone: "error",
      text: "No tenés permiso para configurar el asistente.",
    };
  }

  const nextMode = String(formData.get("mode") ?? "").trim();
  if (nextMode !== "READ_ONLY" && nextMode !== "DISABLED") {
    return {
      tone: "error",
      text: "Modo de asistente no válido.",
    };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      id: true,
      subscriptionTier: true,
      whatsapp: true,
      users: {
        where: { whatsappNumber: { not: null } },
        select: { id: true },
      },
    },
  });
  if (!tenant) {
    return {
      tone: "error",
      text: "No encontramos el negocio.",
    };
  }

  if (!canUseWhatsAppChatbot(tenant.subscriptionTier)) {
    return {
      tone: "warning",
      text: "El asistente de WhatsApp está disponible solo en el plan Premium.",
    };
  }

  if (nextMode === "READ_ONLY") {
    const normalizedBusinessWhatsapp = normalizeWhatsAppNumber(tenant.whatsapp ?? "");
    if (!normalizedBusinessWhatsapp.ok || !normalizedBusinessWhatsapp.value) {
      return {
        tone: "warning",
        text: "Primero cargá un WhatsApp válido del negocio en formato internacional.",
      };
    }

    if (tenant.users.length === 0) {
      return {
        tone: "warning",
        text: "Vinculá al menos un número de WhatsApp a una cuenta antes de activar el asistente.",
      };
    }
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      whatsappChatbotMode: nextMode,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath(`/admin/tenants/${tenant.id}`);
  return {
    tone: "success",
    text:
      nextMode === "READ_ONLY"
        ? "Asistente de WhatsApp activado en modo solo lectura."
        : "Asistente de WhatsApp desactivado.",
  };
}

const changeEmailSchema = z.object({
  email: z.string().email().max(160),
});

export async function updateAccountEmail(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !session.user.tenantId) return;

  const parsed = changeEmailSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  });
  if (!parsed.success) {
    redirect("/dashboard/settings?accountEmail=invalid");
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { email: parsed.data.email, emailVerified: new Date() },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      redirect("/dashboard/settings?accountEmail=used");
    }
    throw error;
  }

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?accountEmail=ok");
}

export async function updateAccountPassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !session.user.tenantId) return;

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    redirect("/dashboard/settings?accountPassword=short");
  }
  if (newPassword !== confirmPassword) {
    redirect("/dashboard/settings?accountPassword=mismatch");
  }

  const user = await prisma.user.findFirst({
    where: { id: session.user.id, tenantId: session.user.tenantId },
    select: { id: true, passwordHash: true },
  });
  if (!user?.passwordHash) {
    redirect("/dashboard/settings?accountPassword=forbidden");
  }

  const matches = await compare(currentPassword, user.passwordHash);
  if (!matches) {
    redirect("/dashboard/settings?accountPassword=wrongCurrent");
  }

  const passwordHash = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?accountPassword=ok");
}

export async function createExpense(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.role !== "OWNER") {
    redirect("/dashboard");
  }

  const parsed = expenseSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    amountArs: formData.get("amountArs"),
    expenseDate: formData.get("expenseDate"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    redirect("/dashboard/expenses?expenseMsg=invalid");
  }

  const expenseDate = new Date(`${parsed.data.expenseDate}T12:00:00.000Z`);
  const note = parsed.data.note?.trim() || null;

  await prisma.tenantExpense.create({
    data: {
      tenantId: session.user.tenantId,
      name: parsed.data.name,
      kind: parsed.data.kind as TenantExpenseKind,
      amountArs: parsed.data.amountArs,
      expenseDate,
      note,
    },
  });

  revalidatePath("/dashboard/expenses");
  redirect("/dashboard/expenses?expenseMsg=created");
}

export async function deleteExpense(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.role !== "OWNER") {
    redirect("/dashboard");
  }

  const expenseId = String(formData.get("expenseId") ?? "").trim();
  if (!expenseId) {
    redirect("/dashboard/expenses?expenseMsg=invalid");
  }

  await prisma.tenantExpense.deleteMany({
    where: {
      id: expenseId,
      tenantId: session.user.tenantId,
    },
  });

  revalidatePath("/dashboard/expenses");
  redirect("/dashboard/expenses?expenseMsg=deleted");
}

export async function deleteTenantPermanently(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    redirect("/dashboard/settings?deleteTenant=forbidden");
  }
  if (session.user.role !== "OWNER") {
    redirect("/dashboard/settings?deleteTenant=forbidden");
  }

  const tenantId = session.user.tenantId;
  const confirmName = String(formData.get("confirmName") ?? "").trim();
  const confirmPhrase = String(formData.get("confirmPhrase") ?? "").trim();
  const understood = String(formData.get("understood") ?? "") === "yes";

  if (!understood) {
    redirect("/dashboard/settings?deleteTenant=unchecked");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true },
  });
  if (!tenant) {
    redirect("/dashboard/settings?deleteTenant=missing");
  }
  if (confirmName !== tenant.name) {
    redirect("/dashboard/settings?deleteTenant=nameMismatch");
  }
  if (confirmPhrase !== "ELIMINAR") {
    redirect("/dashboard/settings?deleteTenant=phrase");
  }

  await prisma.$transaction(async (tx) => {
    await tx.staff.updateMany({
      where: { tenantId },
      data: { userId: null },
    });
    await tx.user.deleteMany({ where: { tenantId } });
    await tx.tenant.delete({ where: { id: tenantId } });
  });

  await signOut({ redirectTo: "/" });
}
