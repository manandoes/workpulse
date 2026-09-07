import type { GoalStatus } from "@/lib/generated/prisma/enums";
import { StatusPill, type PillStyle } from "@/components/dashboard/status-pill";

/** Goal status pill (Design.md § 6, mirrors `components/requests/status-badge.tsx`). */
const STATUS_STYLES: Record<GoalStatus, PillStyle> = {
  Active: {
    text: "text-info-text",
    dot: "bg-info",
    label: "Active",
    description: "Still in progress",
  },
  Achieved: {
    text: "text-success-text",
    dot: "bg-success",
    label: "Achieved",
    description: "Hit",
  },
  Missed: {
    text: "text-danger-text",
    dot: "bg-danger",
    label: "Missed",
    description: "Not hit",
  },
};

export function GoalStatusBadge({
  status,
  className,
}: {
  status: GoalStatus;
  className?: string;
}) {
  return <StatusPill style={STATUS_STYLES[status]} className={className} />;
}
