import {
  billingStatusFromNextDueAt,
  billingStatusLabel,
} from "./billing-utils";

export function TenantBillingStatusBadge({ nextDueAt }: { nextDueAt: Date }) {
  const status = billingStatusFromNextDueAt(nextDueAt);

  const className =
    status === "overdue"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : status === "due_today"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      {billingStatusLabel(status)}
    </span>
  );
}
