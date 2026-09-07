import { daysFromToday, isOpen, isOverdue } from "@/lib/tasks";
import type { TaskStatus } from "@/lib/generated/prisma/enums";

/**
 * Workload calculation (Rules.md section 5 — rules live in `lib/`, not
 * scattered inside routes or components; section 10 — this is critical
 * business logic and needs direct unit tests).
 *
 * Everything here is pure and takes `now` as an argument, like `lib/tasks.ts`,
 * so the deadline-weighting rule can be tested at a fixed instant.
 */

/**
 * Assumed effort for a task nobody has estimated.
 *
 * An un-estimated task must still count against someone's workload — reading
 * it as 0 hours would make skipping the estimate the same as free capacity,
 * which is backwards. This is a judgment call (PRD.md section 6.4 does not say
 * what an un-estimated task is worth), flagged here and in Memory.md's Key
 * Decisions Log the way earlier phases flagged similar assumptions.
 */
export const DEFAULT_ESTIMATE_HOURS = 4;

/** The company-wide default, used until an Owner/Admin/Manager changes it. */
export const DEFAULT_CAPACITY_HOURS = 40;

export type WorkloadTask = {
  status: TaskStatus;
  dueDate: Date | string | null;
  /** From Prisma's Decimal, a plain number, or unset. */
  estimatedHours: { toString(): string } | number | string | null;
};

/**
 * How much a single task counts toward current workload, based on how close
 * its deadline is.
 *
 * A task due this week crowds someone's plate in a way a task due next quarter
 * does not, even at the same estimated effort — this is what lets the
 * calculation reflect "deadlines" rather than only "estimated effort". Closed
 * tasks never reach this (the caller filters on `isOpen` first).
 */
export function urgencyWeight(
  task: { status: TaskStatus; dueDate: Date | string | null },
  now: Date
): number {
  if (isOverdue(task, now)) return 1.5;

  if (!task.dueDate) return 0.7;

  const due =
    task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return 0.7;

  if (due.getTime() < daysFromToday(now, 7).getTime()) return 1.2;
  if (due.getTime() < daysFromToday(now, 30).getTime()) return 1.0;
  return 0.7;
}

function hoursOf(estimatedHours: WorkloadTask["estimatedHours"]): number {
  if (estimatedHours === null || estimatedHours === undefined) {
    return DEFAULT_ESTIMATE_HOURS;
  }
  const value = Number(estimatedHours.toString());
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_ESTIMATE_HOURS;
}

/**
 * An employee's workload, as a percentage of their weekly capacity.
 *
 * Sums every open task's (effort × urgency weight), then divides by capacity.
 * Can read over 100% on purpose — Design.md's Workload Indicator Scale treats
 * 81%+ as one "overloaded" band rather than capping at 100, and a real
 * overload should be visible as such rather than clipped away.
 *
 * 0 for someone with no open tasks — not `null`, which this module reserves
 * for "never computed", a distinct state the caller (`lib/workload-data.ts`)
 * tracks via `workloadUpdatedAt`.
 */
export function calculateWorkloadPercent(
  tasks: readonly WorkloadTask[],
  capacityHours: number,
  now: Date
): number {
  const total = tasks
    .filter((task) => isOpen(task.status))
    .reduce(
      (sum, task) =>
        sum + hoursOf(task.estimatedHours) * urgencyWeight(task, now),
      0
    );

  if (capacityHours <= 0) return total > 0 ? Infinity : 0;

  return Math.round((total / capacityHours) * 10000) / 100;
}

/** Design.md's Workload Indicator Scale, exactly. */
export type WorkloadBand = "success" | "warning" | "danger";

export function workloadBand(percent: number): WorkloadBand {
  if (percent <= 50) return "success";
  if (percent <= 80) return "warning";
  return "danger";
}

/**
 * The word that goes with the color (Design.md section 10 — color never
 * carries meaning alone), matching the pattern `taskStatusLabel` and
 * `OverdueBadge` already use for status colors.
 */
export function workloadBandLabel(band: WorkloadBand): string {
  switch (band) {
    case "success":
      return "On track";
    case "warning":
      return "At risk";
    case "danger":
      return "Overloaded";
  }
}
