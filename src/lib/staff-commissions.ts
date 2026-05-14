import { formatInTimeZone } from "date-fns-tz";

export type BookingCommissionLike = {
  startsAt: Date;
  staffId: string;
  servicePriceCentsSnapshot?: number | null;
  staffCommissionPercentSnapshot?: number | null;
  staffPayoutArsSnapshot?: number | null;
  service?: { priceCents: number | null } | null;
  staff?: { name?: string; commissionPercent: number } | null;
};

export type StaffCommissionExpenseRow = {
  expenseDate: Date;
  staffId: string;
  staffName: string;
  amountArs: number;
  bookingsCount: number;
};

export function normalizeCommissionPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function calculateStaffPayoutArs(servicePriceCents: number | null, commissionPercent: number) {
  const safePriceCents = Math.max(0, servicePriceCents ?? 0);
  const safeCommission = normalizeCommissionPercent(commissionPercent);
  return Math.round((safePriceCents * safeCommission) / 10_000);
}

export function buildBookingFinancialSnapshots(args: {
  servicePriceCents: number | null;
  commissionPercent: number;
}) {
  const staffCommissionPercentSnapshot = normalizeCommissionPercent(args.commissionPercent);
  return {
    servicePriceCentsSnapshot: args.servicePriceCents,
    staffCommissionPercentSnapshot,
    staffPayoutArsSnapshot: calculateStaffPayoutArs(
      args.servicePriceCents,
      staffCommissionPercentSnapshot,
    ),
  };
}

export function resolveBookingServicePriceCents(booking: Pick<
  BookingCommissionLike,
  "servicePriceCentsSnapshot" | "service"
>) {
  return booking.servicePriceCentsSnapshot ?? booking.service?.priceCents ?? 0;
}

export function resolveBookingCommissionPercent(booking: Pick<
  BookingCommissionLike,
  "staffCommissionPercentSnapshot" | "staff"
>) {
  return normalizeCommissionPercent(
    booking.staffCommissionPercentSnapshot ?? booking.staff?.commissionPercent ?? 0,
  );
}

export function resolveBookingPayoutArs(booking: Pick<
  BookingCommissionLike,
  | "servicePriceCentsSnapshot"
  | "staffCommissionPercentSnapshot"
  | "staffPayoutArsSnapshot"
  | "service"
  | "staff"
>) {
  if (typeof booking.staffPayoutArsSnapshot === "number") {
    return booking.staffPayoutArsSnapshot;
  }

  return calculateStaffPayoutArs(
    resolveBookingServicePriceCents(booking),
    resolveBookingCommissionPercent(booking),
  );
}

export function sumStaffPayoutsByStaff(
  bookings: Array<
    Pick<
      BookingCommissionLike,
      | "staffId"
      | "servicePriceCentsSnapshot"
      | "staffCommissionPercentSnapshot"
      | "staffPayoutArsSnapshot"
      | "service"
      | "staff"
    >
  >,
) {
  const totals = new Map<string, number>();

  for (const booking of bookings) {
    const current = totals.get(booking.staffId) ?? 0;
    totals.set(booking.staffId, current + resolveBookingPayoutArs(booking));
  }

  return totals;
}

export function groupCommissionExpensesByStaffDay(
  bookings: Array<BookingCommissionLike>,
  tz: string,
): StaffCommissionExpenseRow[] {
  const grouped = new Map<string, StaffCommissionExpenseRow>();

  for (const booking of bookings) {
    const ymd = formatInTimeZone(booking.startsAt, tz, "yyyy-MM-dd");
    const key = `${ymd}::${booking.staffId}`;
    const existing = grouped.get(key);
    const payout = resolveBookingPayoutArs(booking);
    const staffName = booking.staff?.name ?? "Profesional";

    if (existing) {
      existing.amountArs += payout;
      existing.bookingsCount += 1;
      continue;
    }

    grouped.set(key, {
      expenseDate: new Date(`${ymd}T12:00:00.000Z`),
      staffId: booking.staffId,
      staffName,
      amountArs: payout,
      bookingsCount: 1,
    });
  }

  return [...grouped.values()].sort((a, b) => {
    const diff = b.expenseDate.getTime() - a.expenseDate.getTime();
    return diff !== 0 ? diff : a.staffName.localeCompare(b.staffName, "es-AR");
  });
}
