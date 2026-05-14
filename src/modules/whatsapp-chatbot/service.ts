import { addDays } from "date-fns";
import { formatInTimeZone, toDate } from "date-fns-tz";
import { Prisma, Role, WhatsAppChatOutcome } from "@/generated/prisma";
import { canUseWhatsAppChatbot } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { defaultTimeZone } from "@/lib/timezone";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp-phone";
import { HELP_REPLY, READONLY_ONLY_REPLY } from "./shared";

const MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

function foldText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeIncomingPhone(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false as const, message: "Número vacío." };
  }

  const digits = trimmed.replace(/\D/g, "");
  const normalized = normalizeWhatsAppNumber(trimmed.startsWith("+") ? trimmed : `+${digits}`);
  if (!normalized.ok || !normalized.value) {
    return { ok: false as const, message: "Número inválido." };
  }

  return { ok: true as const, value: normalized.value };
}

function detectBlockedAction(text: string) {
  const normalized = foldText(text);
  if (/\b(cancela|cancelar|cancelacion|anula|anular|borrar)\b/.test(normalized)) {
    return "cancel_booking";
  }
  if (/\b(reprograma|reprogramar|reagendar|mover|cambiar|pasar)\b/.test(normalized)) {
    return "reschedule_booking";
  }
  return null;
}

function parseExplicitDate(text: string, now: Date, tz: string) {
  const normalized = foldText(text);
  const today = toDate(`${formatInTimeZone(now, tz, "yyyy-MM-dd")}T00:00:00`, {
    timeZone: tz,
  });

  if (/\bhoy\b/.test(normalized)) {
    return { ymd: formatInTimeZone(today, tz, "yyyy-MM-dd"), intent: "bookings_today" };
  }

  if (/\bmanana\b/.test(normalized)) {
    const target = addDays(today, 1);
    return { ymd: formatInTimeZone(target, tz, "yyyy-MM-dd"), intent: "bookings_tomorrow" };
  }

  const slashMatch = normalized.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (slashMatch) {
    const day = Number(slashMatch[1]);
    const month = Number(slashMatch[2]);
    const rawYear = slashMatch[3];
    const currentYear = Number(formatInTimeZone(now, tz, "yyyy"));
    const year = rawYear ? Number(rawYear.length === 2 ? `20${rawYear}` : rawYear) : currentYear;
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return {
        ymd: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        intent: "bookings_date_numeric",
      };
    }
  }

  const monthMatch = normalized.match(
    /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?\b/,
  );
  if (monthMatch) {
    const day = Number(monthMatch[1]);
    const month = MONTHS[monthMatch[2]];
    const year = Number(monthMatch[3] ?? formatInTimeZone(now, tz, "yyyy"));
    if (day >= 1 && day <= 31) {
      return {
        ymd: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        intent: "bookings_date_words",
      };
    }
  }

  return null;
}

function resolveStaffFilter(text: string, staff: Array<{ id: string; name: string }>) {
  const normalizedText = ` ${foldText(text)} `;
  const matches = staff.filter((member) => {
    const normalizedName = foldText(member.name);
    const firstToken = normalizedName.split(/\s+/)[0] ?? normalizedName;
    return (
      normalizedText.includes(` ${normalizedName} `) ||
      (firstToken.length >= 3 && normalizedText.includes(` ${firstToken} `))
    );
  });

  return matches.length === 1 ? matches[0] : null;
}

function buildAgendaReply(args: {
  actorRole: Role;
  actorName: string | null;
  businessName: string;
  dateStart: Date;
  bookings: Array<{
    startsAt: Date;
    customerName: string;
    staffName: string;
    serviceName: string;
  }>;
  staffFilterName?: string | null;
  timeZone: string;
}) {
  const dateLabel = formatInTimeZone(args.dateStart, args.timeZone, "EEEE d 'de' MMMM");
  const subject =
    args.actorRole === "EMPLOYEE"
      ? "tu agenda"
      : args.staffFilterName
        ? `la agenda de ${args.staffFilterName}`
        : `la agenda de ${args.businessName}`;

  if (args.bookings.length === 0) {
    return `No veo turnos confirmados para ${subject} el ${dateLabel}.`;
  }

  const lines = args.bookings.map((booking) => {
    const time = formatInTimeZone(booking.startsAt, args.timeZone, "HH:mm");
    const suffix =
      args.actorRole === "OWNER" && !args.staffFilterName ? ` · ${booking.staffName}` : "";
    return `• ${time} · ${booking.customerName} · ${booking.serviceName}${suffix}`;
  });

  return [`Estos son los turnos de ${subject} para el ${dateLabel}:`, ...lines].join("\n");
}

async function createChatLog(args: {
  tenantId?: string | null;
  userId?: string | null;
  phoneNumber: string;
  inboundText: string;
  replyText: string;
  detectedIntent: string;
  outcome: WhatsAppChatOutcome;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.whatsAppChatLog.create({
    data: {
      tenantId: args.tenantId ?? null,
      userId: args.userId ?? null,
      phoneNumber: args.phoneNumber,
      inboundText: args.inboundText.slice(0, 4000),
      replyText: args.replyText.slice(0, 4000),
      detectedIntent: args.detectedIntent,
      outcome: args.outcome,
      ...(args.metadata ? { metadata: args.metadata } : {}),
    },
  });
}

export type WhatsAppChatbotReply = {
  ok: boolean;
  phoneNumber: string;
  replyText: string;
  detectedIntent: string;
  outcome: WhatsAppChatOutcome;
  tenantId: string | null;
  userId: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function handleIncomingWhatsAppText(args: {
  fromPhone: string;
  text: string;
  now?: Date;
  timeZone?: string;
}): Promise<WhatsAppChatbotReply> {
  const tz = args.timeZone ?? defaultTimeZone;
  const now = args.now ?? new Date();
  const inboundText = args.text.trim();
  const normalizedPhone = normalizeIncomingPhone(args.fromPhone);

  if (!normalizedPhone.ok) {
    return {
      ok: false,
      phoneNumber: args.fromPhone,
      replyText: HELP_REPLY,
      detectedIntent: "invalid_phone",
      outcome: WhatsAppChatOutcome.ERROR,
      tenantId: null,
      userId: null,
    };
  }

  const phoneNumber = normalizedPhone.value;
  const linkedUser = await prisma.user.findUnique({
    where: { whatsappNumber: phoneNumber },
    select: {
      id: true,
      name: true,
      role: true,
      tenantId: true,
      staffProfile: {
        select: {
          id: true,
          name: true,
          active: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          active: true,
          subscriptionTier: true,
          whatsappChatbotMode: true,
        },
      },
    },
  });

  if (!linkedUser?.tenantId || !linkedUser.tenant) {
    const replyText =
      "Ese número todavía no está vinculado a una cuenta de Bookment. Pedile al dueño del negocio que lo cargue desde Ajustes.";
    await createChatLog({
      phoneNumber,
      inboundText,
      replyText,
      detectedIntent: "unlinked_phone",
      outcome: WhatsAppChatOutcome.NO_LINK,
    });
    return {
      ok: false,
      phoneNumber,
      replyText,
      detectedIntent: "unlinked_phone",
      outcome: WhatsAppChatOutcome.NO_LINK,
      tenantId: null,
      userId: null,
    };
  }

  if (!linkedUser.tenant.active) {
    const replyText =
      "Tu negocio está pausado en Bookment. Contactá al administrador para reactivar la cuenta.";
    await createChatLog({
      tenantId: linkedUser.tenantId,
      userId: linkedUser.id,
      phoneNumber,
      inboundText,
      replyText,
      detectedIntent: "tenant_inactive",
      outcome: WhatsAppChatOutcome.DISABLED,
    });
    return {
      ok: false,
      phoneNumber,
      replyText,
      detectedIntent: "tenant_inactive",
      outcome: WhatsAppChatOutcome.DISABLED,
      tenantId: linkedUser.tenantId,
      userId: linkedUser.id,
    };
  }

  if (!canUseWhatsAppChatbot(linkedUser.tenant.subscriptionTier)) {
    const replyText =
      "El asistente de WhatsApp está disponible solo en el plan Premium del negocio.";
    await createChatLog({
      tenantId: linkedUser.tenantId,
      userId: linkedUser.id,
      phoneNumber,
      inboundText,
      replyText,
      detectedIntent: "plan_locked",
      outcome: WhatsAppChatOutcome.DISABLED,
    });
    return {
      ok: false,
      phoneNumber,
      replyText,
      detectedIntent: "plan_locked",
      outcome: WhatsAppChatOutcome.DISABLED,
      tenantId: linkedUser.tenantId,
      userId: linkedUser.id,
    };
  }

  if (linkedUser.tenant.whatsappChatbotMode !== "READ_ONLY") {
    const replyText =
      "El asistente de WhatsApp todavía no está habilitado para este negocio.";
    await createChatLog({
      tenantId: linkedUser.tenantId,
      userId: linkedUser.id,
      phoneNumber,
      inboundText,
      replyText,
      detectedIntent: "chatbot_disabled",
      outcome: WhatsAppChatOutcome.DISABLED,
    });
    return {
      ok: false,
      phoneNumber,
      replyText,
      detectedIntent: "chatbot_disabled",
      outcome: WhatsAppChatOutcome.DISABLED,
      tenantId: linkedUser.tenantId,
      userId: linkedUser.id,
    };
  }

  if (linkedUser.role === "EMPLOYEE" && !linkedUser.staffProfile?.active) {
    const replyText =
      "Tu perfil de profesional no está disponible. Pedile al dueño del negocio que lo revise desde el panel.";
    await createChatLog({
      tenantId: linkedUser.tenantId,
      userId: linkedUser.id,
      phoneNumber,
      inboundText,
      replyText,
      detectedIntent: "staff_inactive",
      outcome: WhatsAppChatOutcome.NO_PERMISSION,
    });
    return {
      ok: false,
      phoneNumber,
      replyText,
      detectedIntent: "staff_inactive",
      outcome: WhatsAppChatOutcome.NO_PERMISSION,
      tenantId: linkedUser.tenantId,
      userId: linkedUser.id,
    };
  }

  const blockedAction = detectBlockedAction(inboundText);
  if (blockedAction) {
    await createChatLog({
      tenantId: linkedUser.tenantId,
      userId: linkedUser.id,
      phoneNumber,
      inboundText,
      replyText: READONLY_ONLY_REPLY,
      detectedIntent: blockedAction,
      outcome: WhatsAppChatOutcome.ACTION_BLOCKED,
    });
    return {
      ok: true,
      phoneNumber,
      replyText: READONLY_ONLY_REPLY,
      detectedIntent: blockedAction,
      outcome: WhatsAppChatOutcome.ACTION_BLOCKED,
      tenantId: linkedUser.tenantId,
      userId: linkedUser.id,
    };
  }

  const dateIntent = parseExplicitDate(inboundText, now, tz);
  if (!dateIntent || /\b(ayuda|help|opciones|comandos)\b/.test(foldText(inboundText))) {
    await createChatLog({
      tenantId: linkedUser.tenantId,
      userId: linkedUser.id,
      phoneNumber,
      inboundText,
      replyText: HELP_REPLY,
      detectedIntent: dateIntent?.intent ?? "help",
      outcome: WhatsAppChatOutcome.UNKNOWN,
    });
    return {
      ok: true,
      phoneNumber,
      replyText: HELP_REPLY,
      detectedIntent: dateIntent?.intent ?? "help",
      outcome: WhatsAppChatOutcome.UNKNOWN,
      tenantId: linkedUser.tenantId,
      userId: linkedUser.id,
    };
  }

  const dateStart = toDate(`${dateIntent.ymd}T00:00:00`, { timeZone: tz });
  const dateEnd = addDays(dateStart, 1);
  const ownerStaff =
    linkedUser.role === "OWNER"
      ? await prisma.staff.findMany({
          where: { tenantId: linkedUser.tenantId, active: true },
          select: { id: true, name: true },
          orderBy: { createdAt: "asc" },
        })
      : [];
  const matchedStaff =
    linkedUser.role === "OWNER" ? resolveStaffFilter(inboundText, ownerStaff) : null;
  const scopedStaffId =
    linkedUser.role === "EMPLOYEE" ? linkedUser.staffProfile?.id : matchedStaff?.id ?? undefined;

  const bookings = await prisma.booking.findMany({
    where: {
      tenantId: linkedUser.tenantId,
      status: "CONFIRMED",
      startsAt: { gte: dateStart, lt: dateEnd },
      ...(scopedStaffId ? { staffId: scopedStaffId } : {}),
    },
    select: {
      startsAt: true,
      customerName: true,
      service: { select: { name: true } },
      staff: { select: { name: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const replyText = buildAgendaReply({
    actorRole: linkedUser.role,
    actorName: linkedUser.name ?? linkedUser.staffProfile?.name ?? null,
    businessName: linkedUser.tenant.name,
    dateStart,
    timeZone: tz,
    staffFilterName: matchedStaff?.name ?? null,
    bookings: bookings.map((booking) => ({
      startsAt: booking.startsAt,
      customerName: booking.customerName,
      serviceName: booking.service.name,
      staffName: booking.staff.name,
    })),
  });

  const metadata: Prisma.InputJsonValue = {
    dateYmd: dateIntent.ymd,
    bookingCount: bookings.length,
    staffFilterId: matchedStaff?.id ?? null,
    staffFilterName: matchedStaff?.name ?? null,
  };

  await createChatLog({
    tenantId: linkedUser.tenantId,
    userId: linkedUser.id,
    phoneNumber,
    inboundText,
    replyText,
    detectedIntent: dateIntent.intent,
    outcome: WhatsAppChatOutcome.ANSWERED,
    metadata,
  });

  return {
    ok: true,
    phoneNumber,
    replyText,
    detectedIntent: dateIntent.intent,
    outcome: WhatsAppChatOutcome.ANSWERED,
    tenantId: linkedUser.tenantId,
    userId: linkedUser.id,
    metadata,
  };
}
