import type { ClientStatus, ProjectStatus } from "@/lib/generated/prisma/enums";
import { StatusPill, type PillStyle } from "@/components/dashboard/status-pill";

/** What each project and client status looks like and means (Design.md § 6). */
const PROJECT_STYLES: Record<ProjectStatus, PillStyle> = {
  Planning: {
    text: "text-info-text",
    dot: "bg-info",
    label: "Planning",
    description: "Scoped but not started",
  },
  Active: {
    text: "text-success-text",
    dot: "bg-success",
    label: "Active",
    description: "Work is under way",
  },
  OnHold: {
    text: "text-warning-text",
    dot: "bg-warning",
    label: "On hold",
    description: "Paused — waiting on the client or a decision",
  },
  Completed: {
    text: "text-text-secondary",
    dot: "bg-brand-brown-light",
    label: "Completed",
    description: "Delivered and closed",
  },
  Cancelled: {
    text: "text-danger-text",
    dot: "bg-danger",
    label: "Cancelled",
    description: "Stopped before delivery",
  },
};

const CLIENT_STYLES: Record<ClientStatus, PillStyle> = {
  Active: {
    text: "text-success-text",
    dot: "bg-success",
    label: "Active",
    description: "Currently worked with",
  },
  Archived: {
    text: "text-text-secondary",
    dot: "bg-brand-brown-light",
    label: "Archived",
    description: "Kept for history, hidden from new work",
  },
};

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  return <StatusPill style={PROJECT_STYLES[status]} className={className} />;
}

export function ClientStatusBadge({
  status,
  className,
}: {
  status: ClientStatus;
  className?: string;
}) {
  return <StatusPill style={CLIENT_STYLES[status]} className={className} />;
}

/** The human label for a status, for selects and plain text. */
export function projectStatusLabel(status: ProjectStatus): string {
  return PROJECT_STYLES[status].label;
}
