import { describe, expect, it } from "vitest";
import {
  canJoinTeam,
  clientFilter,
  financialRollup,
  isClosed,
  margin,
  marginPercent,
  projectFilter,
  PROJECT_STATUSES,
  TEAM_ELIGIBLE_STATUSES,
  toAmount,
  type ProjectRollupInput,
} from "@/lib/projects";

describe("margin", () => {
  it("is value minus estimated cost", () => {
    expect(margin(150000, 90000)).toBe(60000);
  });

  it("goes negative when a project costs more than it earns", () => {
    expect(margin(50000, 80000)).toBe(-30000);
  });

  /**
   * The whole point of the null: a project with no recorded cost must not read
   * as pure profit on a dashboard an owner makes decisions from.
   */
  it("is unknown when either side is missing", () => {
    expect(margin(150000, null)).toBeNull();
    expect(margin(null, 90000)).toBeNull();
    expect(margin(undefined, undefined)).toBeNull();
    expect(margin("", "")).toBeNull();
  });

  it("reads Prisma decimals through their string form", () => {
    // What `Decimal` behaves like coming back from the database.
    const decimal = (value: string) => ({ toString: () => value });
    expect(margin(decimal("150000.50"), decimal("90000.25"))).toBe(60000.25);
  });

  it("treats a recorded zero as a real number, not as missing", () => {
    expect(margin(150000, 0)).toBe(150000);
    expect(margin(0, 0)).toBe(0);
  });
});

describe("marginPercent", () => {
  it("is the margin as a share of project value", () => {
    expect(marginPercent(200000, 150000)).toBe(25);
  });

  it("is unknown when the value is zero, rather than dividing by it", () => {
    expect(marginPercent(0, 1000)).toBeNull();
  });

  it("is unknown when either side is missing", () => {
    expect(marginPercent(null, 1000)).toBeNull();
    expect(marginPercent(1000, null)).toBeNull();
  });
});

describe("toAmount", () => {
  it("rejects values that are not numbers", () => {
    expect(toAmount("abc")).toBeNull();
  });

  it("distinguishes an empty field from a zero", () => {
    expect(toAmount("")).toBeNull();
    expect(toAmount("0")).toBe(0);
  });
});

describe("financialRollup", () => {
  const project = (
    overrides: Partial<ProjectRollupInput> = {}
  ): ProjectRollupInput => ({
    value: null,
    estimatedCost: null,
    memberIds: [],
    taskCount: 0,
    doneTaskCount: 0,
    ...overrides,
  });

  it("is all-null/all-zero for no projects at all", () => {
    expect(financialRollup([])).toEqual({
      projectCount: 0,
      teamSize: 0,
      taskCount: 0,
      completionPercent: null,
      value: null,
      estimatedCost: null,
      margin: null,
      marginPercent: null,
    });
  });

  it("dedupes team members shared across projects into one team size", () => {
    const rollup = financialRollup([
      project({ memberIds: ["emp_1", "emp_2"] }),
      project({ memberIds: ["emp_2", "emp_3"] }),
    ]);
    expect(rollup.teamSize).toBe(3);
  });

  it("sums tasks and derives completion across every project", () => {
    const rollup = financialRollup([
      project({ taskCount: 4, doneTaskCount: 3 }),
      project({ taskCount: 6, doneTaskCount: 1 }),
    ]);
    expect(rollup.taskCount).toBe(10);
    expect(rollup.completionPercent).toBe(40);
  });

  it("sums only the projects that recorded a value or a cost", () => {
    const rollup = financialRollup([
      project({ value: 100000 }),
      project({ value: 50000, estimatedCost: 30000 }),
      project(),
    ]);
    expect(rollup.value).toBe(150000);
    expect(rollup.estimatedCost).toBe(30000);
  });

  /**
   * Mirrors `margin()`'s own rule: a missing side must not read as zero. Here
   * that means at least one project must have recorded EACH side before the
   * total means anything.
   */
  it("leaves margin unknown unless both a value and a cost were recorded somewhere", () => {
    expect(financialRollup([project({ value: 100000 })]).margin).toBeNull();
    expect(
      financialRollup([project({ estimatedCost: 40000 })]).margin
    ).toBeNull();
  });

  it("computes margin and margin percent from the summed totals", () => {
    const rollup = financialRollup([
      project({ value: 200000, estimatedCost: 120000 }),
      project({ value: 100000, estimatedCost: 30000 }),
    ]);
    expect(rollup.value).toBe(300000);
    expect(rollup.estimatedCost).toBe(150000);
    expect(rollup.margin).toBe(150000);
    expect(rollup.marginPercent).toBe(50);
  });

  it("still counts completed and cancelled projects' financials", () => {
    // financialRollup itself is status-agnostic; excluding a status is the
    // caller's job (lib/financials-data.ts deliberately does not).
    const rollup = financialRollup([
      project({ value: 100000, estimatedCost: 60000 }),
    ]);
    expect(rollup.value).toBe(100000);
  });
});

describe("canJoinTeam", () => {
  it("allows active and invited employees", () => {
    expect(canJoinTeam("Active")).toBe(true);
    expect(canJoinTeam("Invited")).toBe(true);
  });

  /**
   * Suspension revokes access, so staffing a suspended person onto new work
   * would misrepresent who is delivering it.
   */
  it("refuses a suspended employee", () => {
    expect(canJoinTeam("Suspended")).toBe(false);
  });

  /**
   * The picker query filters on this same list. If the two ever disagree, the
   * UI would offer somebody the API then refuses.
   */
  it("agrees with the list the candidate query filters on", () => {
    for (const status of TEAM_ELIGIBLE_STATUSES) {
      expect(canJoinTeam(status)).toBe(true);
    }
  });
});

describe("isClosed", () => {
  it("is true only for completed and cancelled work", () => {
    expect(isClosed("Completed")).toBe(true);
    expect(isClosed("Cancelled")).toBe(true);
    expect(isClosed("Planning")).toBe(false);
    expect(isClosed("Active")).toBe(false);
    expect(isClosed("OnHold")).toBe(false);
  });

  it("covers every status in the enum", () => {
    for (const status of PROJECT_STATUSES) {
      expect(typeof isClosed(status)).toBe("boolean");
    }
  });
});

describe("projectFilter", () => {
  it("is empty when nothing is filtered, so the list shows everything", () => {
    expect(projectFilter({})).toEqual({});
  });

  it("searches the name, code, description and the client's name", () => {
    const where = projectFilter({ q: "northwind" }) as {
      OR: Record<string, unknown>[];
    };

    expect(where.OR).toHaveLength(4);
    expect(where.OR).toContainEqual({
      client: { name: { contains: "northwind", mode: "insensitive" } },
    });
  });

  it("ignores a blank search rather than matching nothing", () => {
    expect(projectFilter({ q: "   " })).toEqual({});
  });

  it("filters by client and status", () => {
    expect(projectFilter({ clientId: "client_1", status: "Active" })).toEqual({
      clientId: "client_1",
      status: "Active",
    });
  });

  /**
   * Rules.md section 2: this returns the filter half only. The caller wraps it
   * in `scopedWhere`, which applies `companyId` last — so a filter can never
   * carry a company of its own into the query.
   */
  it("never sets a companyId of its own", () => {
    const where = projectFilter({
      q: "anything",
      clientId: "client_1",
      status: "Active",
    });
    expect(where).not.toHaveProperty("companyId");
  });
});

describe("clientFilter", () => {
  it("searches the name and the contact", () => {
    const where = clientFilter({ q: "priya" }) as {
      OR: Record<string, unknown>[];
    };

    expect(where.OR).toHaveLength(3);
  });

  it("filters by status", () => {
    expect(clientFilter({ status: "Archived" })).toEqual({
      status: "Archived",
    });
  });

  it("never sets a companyId of its own", () => {
    expect(clientFilter({ q: "x", status: "Active" })).not.toHaveProperty(
      "companyId"
    );
  });
});
