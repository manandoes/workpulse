import { AlertTriangle } from "lucide-react";
import type { TaskPriority, TaskStatus } from "@/lib/generated/prisma/enums";
import { StatusPill, type PillStyle } from "@/components/dashboard/status-pill";

/**
 * Task status, priority and overdue pills (Design.md § 6).
 *
 * Three separate vocabularies on purpose. A task's stage, its urgency and
 * whether it has slipped are three different facts, and PRD.md section 6.3
 * lists "Overdue" alongside the statuses precisely because people conflate
 * them — showing them as separate pills is what keeps "in progress and late"
 * readable.
 */
const STATUS_STYLES: Record<TaskStatus, PillStyle> = {
  Todo: {
    text: "text-text-secondary",
    dot: "bg-brand-brown-light",
    label: "To do",
    description: "Waiting to be picked up",
  },
  InProgress: {
    text: "text-info-text",
    dot: "bg-info",
    label: "In progress",
    description: "Being worked on now",
  },
  InReview: {
    text: "text-warning-text",
    dot: "bg-warning",
    label: "In review",
    description: "Done by the assignee, waiting on a check",
  },
  Done: {
    text: "text-success-text",
    dot: "bg-success",
    label: "Done",
    description: "Finished and accepted",
  },
};

const PRIORITY_STYLES: Record<TaskPriority, PillStyle> = {
  Low: {
    text: "text-text-secondary",
    dot: "bg-brand-brown-light",
    label: "Low",
    description: "Can wait",
  },
  Medium: {
    text: "text-info-text",
    dot: "bg-info",
    label: "Medium",
    description: "Normal priority",
  },
  High: {
    text: "text-warning-text",
    dot: "bg-warning",
    label: "High",
    description: "Ahead of the normal queue",
  },
  Urgent: {
    text: "text-danger-text",
    dot: "bg-danger",
    label: "Urgent",
    description: "Drop other work for this",
  },
};

const OVERDUE_STYLE: PillStyle = {
  text: "text-danger-text",
  dot: "bg-danger",
  label: "Overdue",
  description: "Past its due date and not finished",
};

export function TaskStatusBadge({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  return <StatusPill style={STATUS_STYLES[status]} className={className} />;
}

export function TaskPriorityBadge({
  priority,
  className,
}: {
  priority: TaskPriority;
  className?: string;
}) {
  return <StatusPill style={PRIORITY_STYLES[priority]} className={className} />;
}

/**
 * The overdue flag (Phases.md Phase 5 — "overdue tasks are auto-flagged").
 *
 * Derived by `isOverdue` at read time, never stored, so it is right the moment
 * a deadline passes and cannot be left behind by a job that did not run. The
 * icon replaces the dot because this one is a warning rather than a state, but
 * the word "Overdue" is still there: colour never carries meaning alone
 * (Design.md § 10).
 */
export function OverdueBadge({ className }: { className?: string }) {
  return (
    <StatusPill
      style={OVERDUE_STYLE}
      className={className}
      icon={
        <AlertTriangle aria-hidden className="size-3.5" strokeWidth={1.5} />
      }
    />
  );
}

/** The human label for a status, for selects and plain text. */
export function taskStatusLabel(status: TaskStatus): string {
  return STATUS_STYLES[status].label;
}

/** The human label for a priority. */
export function taskPriorityLabel(priority: TaskPriority): string {
  return PRIORITY_STYLES[priority].label;
}
