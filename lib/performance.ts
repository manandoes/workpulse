import type { GoalStatus, TaskStatus } from "@/lib/generated/prisma/enums";

/**
 * Performance scoring logic (Rules.md section 5 — rules live in `lib/`, not
 * scattered inside routes or components; section 10 — this is critical
 * business logic and needs direct unit tests).
 *
 * Mirrors `lib/workload.ts`: everything here is pure, and every judgment call
 * PRD.md section 6.5 leaves open is documented in place, the single spot to
 * retune it if real data shows it reading wrong.
 */

export type TaskSignal = {
  status: TaskStatus;
  dueDate: Date | string | null;
  completedAt: Date | string | null;
};

function toDate(value: Date | string | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Share of ever-assigned tasks that reached Done, as a percentage.
 *
 * `null` when the employee has never been assigned a task at all — there is
 * nothing to have a completion rate about yet, which is different from having
 * completed 0% of something.
 */
export function taskCompletionRate(
  tasks: readonly TaskSignal[]
): number | null {
  if (tasks.length === 0) return null;
  const done = tasks.filter((task) => task.status === "Done").length;
  return (done / tasks.length) * 100;
}

/**
 * Of the tasks that reached Done, the share finished at or before their due
 * date. A task with no due date can't have been late, so it counts as on
 * time. `null` until at least one task is Done — an on-time *rate* needs a
 * finished task to be a rate of anything.
 */
export function onTimeDeliveryRate(
  tasks: readonly TaskSignal[]
): number | null {
  const done = tasks.filter((task) => task.status === "Done");
  if (done.length === 0) return null;

  const onTime = done.filter((task) => {
    const due = toDate(task.dueDate);
    if (!due) return true;
    const completed = toDate(task.completedAt);
    return !completed || completed.getTime() <= due.getTime();
  }).length;

  return (onTime / done.length) * 100;
}

/**
 * How much of the score "workload carried" contributes.
 *
 * `null` if workload has never been computed for this employee (Phase 6's
 * `workloadPercent` starts `null`, not 0). Otherwise capped at 100: carrying
 * up to full capacity counts as full contribution, but overload is capped
 * rather than rewarded — this score should not encourage taking on more than
 * capacity allows, and Design.md's Workload Indicator Scale already flags
 * that as a risk elsewhere (the workload bar), not as something to chase here.
 */
export function workloadContribution(
  workloadPercent: number | null
): number | null {
  if (workloadPercent === null) return null;
  return Math.min(workloadPercent, 100);
}

/**
 * Average manager-feedback rating (1–5), scaled to 0–100. `null` if nobody
 * has given this employee feedback yet — excluded from the score rather than
 * counted as a low rating, since no feedback is not the same as bad feedback.
 */
export function feedbackContribution(
  ratings: readonly number[]
): number | null {
  if (ratings.length === 0) return null;
  const average =
    ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  return ((average - 1) / 4) * 100;
}

/**
 * Share of *decided* goals that were Achieved rather than Missed.
 *
 * A still-`Active` goal isn't yet a data point on whether it was hit, so it is
 * excluded from both sides of the ratio — including it at 0% credit would
 * punish an employee for a goal simply not having concluded yet. `null` when
 * there are no decided goals (none set, or all still `Active`).
 */
export function goalContribution(
  goals: readonly { status: GoalStatus }[]
): number | null {
  const achieved = goals.filter((goal) => goal.status === "Achieved").length;
  const missed = goals.filter((goal) => goal.status === "Missed").length;
  const decided = achieved + missed;
  if (decided === 0) return null;
  return (achieved / decided) * 100;
}

/**
 * Relative importance of each score input. PRD.md section 6.5 names these
 * five inputs but gives no formula — a judgment call, flagged here and in
 * Memory.md's Key Decisions Log the way Phase 6 flagged its own weights.
 */
export const PERFORMANCE_WEIGHTS = {
  completion: 30,
  onTime: 25,
  workload: 15,
  feedback: 15,
  goals: 15,
} as const;

export type PerformanceInput = {
  tasks: readonly TaskSignal[];
  workloadPercent: number | null;
  feedbackRatings: readonly number[];
  goals: readonly { status: GoalStatus }[];
};

/**
 * The performance score PRD.md section 6.5 calls a "continuous scoring
 * engine", 0–100.
 *
 * Only components that returned a value are averaged, with the remaining
 * weights renormalized to sum to 100 — a brand-new hire with no feedback or
 * goals yet is scored on what does exist (their tasks) rather than having
 * "no feedback" silently act like a 0. Returns `null` only when every
 * component is `null` — nothing at all to score yet, in which case the caller
 * writes no `PerformanceRecord` (Architecture.md's history model, unlike
 * `workloadPercent`'s single cached value).
 */
export function calculatePerformanceScore(
  input: PerformanceInput
): number | null {
  const components: { weight: number; value: number }[] = [
    {
      weight: PERFORMANCE_WEIGHTS.completion,
      value: taskCompletionRate(input.tasks),
    },
    {
      weight: PERFORMANCE_WEIGHTS.onTime,
      value: onTimeDeliveryRate(input.tasks),
    },
    {
      weight: PERFORMANCE_WEIGHTS.workload,
      value: workloadContribution(input.workloadPercent),
    },
    {
      weight: PERFORMANCE_WEIGHTS.feedback,
      value: feedbackContribution(input.feedbackRatings),
    },
    { weight: PERFORMANCE_WEIGHTS.goals, value: goalContribution(input.goals) },
  ].flatMap(({ weight, value }) => (value === null ? [] : [{ weight, value }]));

  if (components.length === 0) return null;

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const weighted = components.reduce((sum, c) => sum + c.value * c.weight, 0);

  return Math.round((weighted / totalWeight) * 100) / 100;
}

/** A performance band for display, reusing Design.md's success/warning/danger
 * status palette (Design.md § 10 — color never carries meaning alone). */
export type PerformanceBand = "success" | "warning" | "danger";

/**
 * Thresholds are a judgment call, like `workloadBand`'s — PRD.md section 6.5
 * doesn't give bands, only that the score should be "directional/indicative".
 */
export function performanceBand(score: number): PerformanceBand {
  if (score >= 70) return "success";
  if (score >= 40) return "warning";
  return "danger";
}

export function performanceBandLabel(band: PerformanceBand): string {
  switch (band) {
    case "success":
      return "Strong";
    case "warning":
      return "Steady";
    case "danger":
      return "Needs support";
  }
}
