"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { auth, signOut } from "@/auth";
import { BlockReason, BookingStatus } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { parseDatetimeLocalToUtc } from "@/lib/datetime-local";
import { defaultTimeZone } from "@/lib/timezone";

function readBlockRange(formData: FormData, dateKey: string, timeKey: string, tz: string) {
  const d = String(formData.get(dateKey) ?? "").trim();
  const t = String(formData.get(timeKey) ?? "").trim();
  if (!d || !t) return null;
  return parseDatetimeLocalToUtc(`${d}T${t}`, tz);
}

export async function cancelBooking(bookingId: string) {
  const session = await auth();
  if (!session?.user?.tenantId) return;

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, tenantId: session.user.tenantId },
  });
  if (!booking) return;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");
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

  await prisma.service.create({
    data: {
      tenantId: session.user.tenantId,
      name,
      durationMinutes,
      priceCents: priceCents ?? null,
    },
  });

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

export async function addSuggestedService(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) return;

  const name = String(formData.get("name") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes"));
  if (name.length < 2) return;
  if (!Number.isFinite(durationMinutes) || durationMinutes < 5) return;

  const existing = await prisma.service.findFirst({
    where: { tenantId: session.user.tenantId, name },
  });

  if (existing) {
    await prisma.service.update({
      where: { id: existing.id },
      data: { active: true, durationMinutes },
    });
  } else {
    await prisma.service.create({
      data: {
        tenantId: session.user.tenantId,
        name,
        durationMinutes,
        active: true,
      },
    });
  }

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

export async function createStaff(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) return;

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return;

  await prisma.staff.create({
    data: { tenantId: session.user.tenantId, name },
  });

  revalidatePath("/dashboard/settings");
}

export async function updateStaff(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) return;

  const staffId = String(formData.get("staffId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!staffId || name.length < 2) return;

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!staff) return;

  await prisma.staff.update({
    where: { id: staff.id },
    data: { name },
  });

  revalidatePath("/dashboard/settings");
}

export async function deleteStaff(formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) return;

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
  if (!session?.user?.tenantId) return;

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
  if (!session?.user?.tenantId) return;

  const staffId = String(formData.get("staffId") ?? "");
  if (!staffId) return;

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, tenantId: session.user.tenantId },
    select: { id: true, active: true },
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

  await prisma.staff.delete({ where: { id: staff.id } });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/hours");
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
      data: { email: parsed.data.email },
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
