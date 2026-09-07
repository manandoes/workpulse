import { completionPercent } from "@/lib/tasks";
import type {
  ClientStatus,
  EmployeeStatus,
  ProjectStatus,
} from "@/lib/generated/prisma/enums";

/**
 * Client and project business logic (Rules.md section 5 — rules live in `lib/`,
 * not inside route handlers or components).
 *
 * Everything here is pure so it can be unit-tested directly: the list filters,
 * the money arithmetic and the team-eligibility rule.
 */

// ---------------------------------------------------------------------------
// Status vocabulary
// ---------------------------------------------------------------------------

/** Ordered as a project moves through its life, which is how lists sort. */
export const PROJECT_STATUSES = [
  "Planning",
  "Active",
  "OnHold",
  "Completed",
  "Cancelled",
] as const;

export const CLIENT_STATUSES = ["Active", "Archived"] as const;

/**
 * A project nobody is working on any more. Used to keep finished work out of
 * the default list and out of the "current projects" a profile shows.
 */
export function isClosed(status: ProjectStatus): boolean {
  return status === "Completed" || status === "Cancelled";
}

// ---------------------------------------------------------------------------
// Money (Phases.md Phase 4 — basic project financials)
// ---------------------------------------------------------------------------

/**
 * Money arrives from Prisma as a Decimal and from a form as a string. Both
 * describe an exact decimal, so both are accepted and read through their string
 * form rather than being coerced early.
 */
export type MoneyInput =
  { toString(): string } | number | string | null | undefined;

/** `null` for "not recorded", which is different from zero. */
export function toAmount(value: MoneyInput): number | null {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value.toString());
  return Number.isFinite(amount) ? amount : null;
}

/**
 * Value minus estimated cost (PRD.md section 6.7).
 *
 * Derived on read and never stored, so it cannot disagree with the two numbers
 * it comes from. `null` when either side is unknown — a missing cost must not
 * be read as "all profit".
 */
export function margin(
  value: MoneyInput,
  estimatedCost: MoneyInput
): number | null {
  const amount = toAmount(value);
  const cost = toAmount(estimatedCost);
  if (amount === null || cost === null) return null;
  return amount - cost;
}

/** Margin as a percentage of project value. `null` when value is unknown or zero. */
export function marginPercent(
  value: MoneyInput,
  estimatedCost: MoneyInput
): number | null {
  const amount = toAmount(value);
  const difference = margin(value, estimatedCost);
  if (amount === null || difference === null || amount === 0) return null;
  return (difference / amount) * 100;
}

// ---------------------------------------------------------------------------
// Financial rollups (Phases.md Phase 11 — per-client and agency-wide totals)
// ---------------------------------------------------------------------------

export type ProjectRollupInput = {
  value: MoneyInput;
  estimatedCost: MoneyInput;
  /** Employee ids on this project's team, for a deduplicated team size. */
  memberIds: readonly string[];
  taskCount: number;
  doneTaskCount: number;
};

export type FinancialRollup = {
  projectCount: number;
  /** Distinct employees across every rolled-up project, not a per-project sum. */
  teamSize: number;
  taskCount: number;
  completionPercent: number | null;
  /** Sum of the projects that recorded a value. `null` when none did. */
  value: number | null;
  /** Sum of the projects that recorded a cost. `null` when none did. */
  estimatedCost: number | null;
  /**
   * `value - estimatedCost`. `null` unless at least one project recorded a
   * value AND at least one recorded a cost — the same "a missing side must
   * not be read as zero" rule `margin()` applies to a single project.
   */
  margin: number | null;
  marginPercent: number | null;
};

/**
 * Roll several projects' financials into one total — a client's own
 * projects, or every project in the company for the agency-wide view. Both
 * are the same arithmetic over a different slice of projects, so this is the
 * one function both `lib/financials-data.ts` call sites share.
 *
 * Every project's own status counts, including `Completed`/`Cancelled`: its
 * revenue and cost already happened, and excluding it would undercount the
 * agency's real numbers.
 */
export function financialRollup(
  projects: readonly ProjectRollupInput[]
): FinancialRollup {
  const teamSize = new Set(projects.flatMap((project) => project.memberIds))
    .size;
  const taskCount = projects.reduce(
    (sum, project) => sum + project.taskCount,
    0
  );
  const doneTaskCount = projects.reduce(
    (sum, project) => sum + project.doneTaskCount,
    0
  );

  const values = projects
    .map((project) => toAmount(project.value))
    .filter((amount): amount is number => amount !== null);
  const costs = projects
    .map((project) => toAmount(project.estimatedCost))
    .filter((amount): amount is number => amount !== null);

  const value = values.length > 0 ? values.reduce((a, b) => a + b, 0) : null;
  const estimatedCost =
    costs.length > 0 ? costs.reduce((a, b) => a + b, 0) : null;
  const rollupMargin =
    value !== null && estimatedCost !== null ? value - estimatedCost : null;
  const marginPercent =
    rollupMargin !== null && value ? (rollupMargin / value) * 100 : null;

  return {
    projectCount: projects.length,
    teamSize,
    taskCount,
    completionPercent: completionPercent(taskCount, doneTaskCount),
    value,
    estimatedCost,
    margin: rollupMargin,
    marginPercent,
  };
}

// ---------------------------------------------------------------------------
// Team membership
// ---------------------------------------------------------------------------

/**
 * Who can be put on a project team.
 *
 * A suspended employee has had their access revoked, so adding them to new work
 * would be misleading. Invited employees are allowed: staffing a project before
 * someone's first login is normal.
 *
 * The list is exported because the "who can I add?" query filters on it — that
 * way the picker and the guard cannot disagree about who is eligible.
 */
export const TEAM_ELIGIBLE_STATUSES = [
  "Invited",
  "Active",
] as const satisfies readonly EmployeeStatus[];

export function canJoinTeam(status: EmployeeStatus): boolean {
  return (TEAM_ELIGIBLE_STATUSES as readonly EmployeeStatus[]).includes(status);
}

// ---------------------------------------------------------------------------
// List filters
// ---------------------------------------------------------------------------

export type ProjectFilters = {
  q?: string;
  clientId?: string;
  status?: ProjectStatus;
};

/**
 * Build the `where` fragment for the project list.
 *
 * Returns only the filter half — the caller wraps it in `scopedWhere()` so the
 * tenant filter is applied last and can never be overridden
 * (Rules.md section 2).
 */
export function projectFilter(filters: ProjectFilters) {
  const where: Record<string, unknown> = {};

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { code: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      // Searching the client's name is what people actually type when they are
      // looking for "the Northwind work".
      { client: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.status) where.status = filters.status;

  return where;
}

export type ClientFilters = {
  q?: string;
  status?: ClientStatus;
};

/** The same shape for the client list. */
export function clientFilter(filters: ClientFilters) {
  const where: Record<string, unknown> = {};

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { contactName: { contains: q, mode: "insensitive" } },
      { contactEmail: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filters.status) where.status = filters.status;

  return where;
}
