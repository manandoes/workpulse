import { isOverdue } from "@/lib/tasks";
import type {
  AlertSeverity,
  AlertType,
  ProjectStatus,
  RequestStatus,
  RequestType,
  TaskStatus,
} from "@/lib/generated/prisma/enums";

/**
 * The early-warning rule engine (Rules.md section 5 — rules live in `lib/`,
 * not scattered inside routes or components; section 10 — this is critical
 * business logic and needs direct unit tests).
 *
 * Mirrors `lib/workload.ts`/`lib/performance.ts`: everything here is pure,
 * takes `now` and thresholds as arguments, and every judgment call PRD.md
 * section 6.8 leaves open is documented in place.
 */

export const ALERT_TYPES: readonly AlertType[] = [
  "OverdueTask",
  "OverloadedEmployee",
  "StalledProject",
  "AgingApproval",
] as const;

export function alertTypeLabel(type: AlertType): string {
  switch (type) {
    case "OverdueTask":
      return "Overdue task";
    case "OverloadedEmployee":
      return "Overloaded employee";
    case "StalledProject":
      return "Stalled project";
    case "AgingApproval":
      return "Aging approval";
  }
}

/**
 * `AgingApproval` is the only `Critical` type: a request sitting undecided
 * blocks the employee waiting on it in a way the other three don't have an
 * equivalent for, so it is treated as the most urgent category. A judgment
 * call — PRD.md section 6.8 doesn't rank its four rule types against each
 * other. The exceptions panel's third color, green, is not a severity at
 * all: it is the panel's own all-clear state when no alert exists.
 */
export function alertSeverityFor(type: AlertType): AlertSeverity {
  return type === "AgingApproval" ? "Critical" : "Warning";
}

export type AlertDraft = {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  link: string;
  employeeId?: string;
  projectId?: string;
};

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export type OverdueTaskInput = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: Date | string | null;
  assigneeId: string | null;
  projectId: string;
};

/** One alert per overdue task — each is independently actionable. */
export function overdueTaskAlerts(
  tasks: readonly OverdueTaskInput[],
  now: Date
): AlertDraft[] {
  return tasks
    .filter((task) => isOverdue(task, now))
    .map((task) => ({
      type: "OverdueTask" as const,
      severity: alertSeverityFor("OverdueTask"),
      message: `"${task.title}" is overdue.`,
      link: `/tasks/${task.id}`,
      employeeId: task.assigneeId ?? undefined,
      projectId: task.projectId,
    }));
}

export type OverloadedEmployeeInput = {
  id: string;
  fullName: string;
  workloadPercent: number | null;
};

/** One alert per employee whose cached workload is over the company's threshold. */
export function overloadedEmployeeAlerts(
  employees: readonly OverloadedEmployeeInput[],
  thresholdPercent: number
): AlertDraft[] {
  return employees
    .filter(
      (employee) =>
        employee.workloadPercent !== null &&
        employee.workloadPercent > thresholdPercent
    )
    .map((employee) => ({
      type: "OverloadedEmployee" as const,
      severity: alertSeverityFor("OverloadedEmployee"),
      message: `${employee.fullName} is at ${employee.workloadPercent!.toFixed(1)}% workload.`,
      link: `/employees/${employee.id}`,
      employeeId: employee.id,
    }));
}

export type StalledProjectInput = {
  id: string;
  name: string;
  status: ProjectStatus;
  /** The most recent `updatedAt` among the project's tasks, or `null` if it has none. */
  lastTaskActivityAt: Date | string | null;
};

const STALLABLE_STATUSES: readonly ProjectStatus[] = [
  "Planning",
  "Active",
  "OnHold",
];

/**
 * A still-in-flight project with at least one task, where no task has
 * changed in more than `staleDays`. A project with zero tasks yet is "not
 * started", a different problem PRD.md doesn't ask this rule to catch, so it
 * is excluded rather than flagged as stalled from day one.
 */
export function stalledProjectAlerts(
  projects: readonly StalledProjectInput[],
  staleDays: number,
  now: Date
): AlertDraft[] {
  const cutoff = daysAgo(now, staleDays);

  return projects
    .filter((project) => STALLABLE_STATUSES.includes(project.status))
    .filter((project) => project.lastTaskActivityAt !== null)
    .filter((project) => {
      const lastActivity =
        project.lastTaskActivityAt instanceof Date
          ? project.lastTaskActivityAt
          : new Date(project.lastTaskActivityAt as string);
      return lastActivity.getTime() < cutoff.getTime();
    })
    .map((project) => ({
      type: "StalledProject" as const,
      severity: alertSeverityFor("StalledProject"),
      message: `"${project.name}" has had no task activity in over ${staleDays} days.`,
      link: `/projects/${project.id}`,
      projectId: project.id,
    }));
}

export type AgingApprovalInput = {
  id: string;
  subject: string;
  type: RequestType;
  status: RequestStatus;
  createdAt: Date | string;
  employeeId: string;
};

/** A still-`Pending` request submitted more than `agingDays` ago. */
export function agingApprovalAlerts(
  requests: readonly AgingApprovalInput[],
  agingDays: number,
  now: Date
): AlertDraft[] {
  const cutoff = daysAgo(now, agingDays);

  return requests
    .filter((request) => request.status === "Pending")
    .filter((request) => {
      const submitted =
        request.createdAt instanceof Date
          ? request.createdAt
          : new Date(request.createdAt);
      return submitted.getTime() < cutoff.getTime();
    })
    .map((request) => ({
      type: "AgingApproval" as const,
      severity: alertSeverityFor("AgingApproval"),
      message: `"${request.subject}" has been pending for more than ${agingDays} days.`,
      link: `/requests/${request.id}`,
      employeeId: request.employeeId,
    }));
}

export type GenerateAlertsInput = {
  tasks: readonly OverdueTaskInput[];
  employees: readonly OverloadedEmployeeInput[];
  projects: readonly StalledProjectInput[];
  requests: readonly AgingApprovalInput[];
  overloadThresholdPercent: number;
  stalledProjectDays: number;
  agingApprovalDays: number;
  now: Date;
};

/** Every currently-triggered alert, across all four rules. */
export function generateAlerts(input: GenerateAlertsInput): AlertDraft[] {
  return [
    ...overdueTaskAlerts(input.tasks, input.now),
    ...overloadedEmployeeAlerts(
      input.employees,
      input.overloadThresholdPercent
    ),
    ...stalledProjectAlerts(
      input.projects,
      input.stalledProjectDays,
      input.now
    ),
    ...agingApprovalAlerts(input.requests, input.agingApprovalDays, input.now),
  ];
}
