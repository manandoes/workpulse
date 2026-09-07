import type { RequestStatus } from "@/lib/generated/prisma/enums";
import { StatusPill, type PillStyle } from "@/components/dashboard/status-pill";

/**
 * Request status pill (Design.md § 6, mirrors `components/tasks/status-badge.tsx`).
 */
const STATUS_STYLES: Record<RequestStatus, PillStyle> = {
  Pending: {
    text: "text-warning-text",
    dot: "bg-warning",
    label: "Pending",
    description: "Waiting on a decision",
  },
  Approved: {
    text: "text-success-text",
    dot: "bg-success",
    label: "Approved",
    description: "Decided and approved",
  },
  Rejected: {
    text: "text-danger-text",
    dot: "bg-danger",
    label: "Rejected",
    description: "Decided and rejected",
  },
};

export function RequestStatusBadge({
  status,
  className,
}: {
  status: RequestStatus;
  className?: string;
}) {
  return <StatusPill style={STATUS_STYLES[status]} className={className} />;
}

export { requestStatusLabel, requestTypeLabel } from "@/lib/requests";
