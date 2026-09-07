import { describe, expect, it } from "vitest";
import {
  calculateWorkloadPercent,
  DEFAULT_ESTIMATE_HOURS,
  urgencyWeight,
  workloadBand,
  workloadBandLabel,
} from "@/lib/workload";

/** Mid-afternoon on 9 September, matching lib/tasks.test.ts's fixed instant. */
const NOW = new Date("2026-09-09T15:30:00.000Z");
const due = (day: string) => new Date(`${day}T00:00:00.000Z`);

describe("urgencyWeight", () => {
  it("weighs overdue work heaviest", () => {
    expect(
      urgencyWeight({ status: "Todo", dueDate: due("2026-09-01") }, NOW)
    ).toBe(1.5);
  });

  it("weighs work due within a week above work due within a month", () => {
    expect(
      urgencyWeight({ status: "Todo", dueDate: due("2026-09-14") }, NOW)
    ).toBe(1.2);
    expect(
      urgencyWeight({ status: "Todo", dueDate: due("2026-10-05") }, NOW)
    ).toBe(1.0);
  });

  it("weighs undated and far-future work the same, lightest", () => {
    expect(urgencyWeight({ status: "Todo", dueDate: null }, NOW)).toBe(0.7);
    expect(
      urgencyWeight({ status: "Todo", dueDate: due("2027-01-01") }, NOW)
    ).toBe(0.7);
  });
});

describe("calculateWorkloadPercent", () => {
  it("is 0 for someone with no open tasks", () => {
    expect(calculateWorkloadPercent([], 40, NOW)).toBe(0);
  });

  it("ignores Done tasks", () => {
    const percent = calculateWorkloadPercent(
      [{ status: "Done", dueDate: due("2026-09-01"), estimatedHours: 100 }],
      40,
      NOW
    );
    expect(percent).toBe(0);
  });

  it("divides weighted effort by capacity", () => {
    // 10 hours due next month (weight 1.0) against a 40h week = 25%.
    const percent = calculateWorkloadPercent(
      [{ status: "Todo", dueDate: due("2026-10-05"), estimatedHours: 10 }],
      40,
      NOW
    );
    expect(percent).toBe(25);
  });

  it("weighs an overdue task's hours more heavily than the same hours due later", () => {
    const overdue = calculateWorkloadPercent(
      [{ status: "Todo", dueDate: due("2026-09-01"), estimatedHours: 10 }],
      40,
      NOW
    );
    const later = calculateWorkloadPercent(
      [{ status: "Todo", dueDate: due("2027-01-01"), estimatedHours: 10 }],
      40,
      NOW
    );
    expect(overdue).toBeGreaterThan(later);
  });

  it("assumes a default estimate for a task nobody sized", () => {
    const percent = calculateWorkloadPercent(
      [{ status: "Todo", dueDate: null, estimatedHours: null }],
      40,
      NOW
    );
    expect(percent).toBe(
      Math.round(((DEFAULT_ESTIMATE_HOURS * 0.7) / 40) * 10000) / 100
    );
  });

  it("accepts a Prisma Decimal-shaped value", () => {
    const percent = calculateWorkloadPercent(
      [
        {
          status: "Todo",
          dueDate: due("2026-10-05"),
          estimatedHours: { toString: () => "10" },
        },
      ],
      40,
      NOW
    );
    expect(percent).toBe(25);
  });

  it("can read over 100% for a real overload rather than clipping", () => {
    const percent = calculateWorkloadPercent(
      [{ status: "Todo", dueDate: due("2026-09-01"), estimatedHours: 40 }],
      40,
      NOW
    );
    expect(percent).toBe(150);
  });

  it("sums effort across every open task", () => {
    const percent = calculateWorkloadPercent(
      [
        { status: "Todo", dueDate: due("2026-10-05"), estimatedHours: 10 },
        {
          status: "InProgress",
          dueDate: due("2026-10-05"),
          estimatedHours: 10,
        },
      ],
      40,
      NOW
    );
    expect(percent).toBe(50);
  });

  it("scales with a different weekly capacity", () => {
    const percent = calculateWorkloadPercent(
      [{ status: "Todo", dueDate: due("2026-10-05"), estimatedHours: 10 }],
      20,
      NOW
    );
    expect(percent).toBe(50);
  });
});

describe("workloadBand", () => {
  it("matches Design.md's Workload Indicator Scale exactly", () => {
    expect(workloadBand(0)).toBe("success");
    expect(workloadBand(50)).toBe("success");
    expect(workloadBand(51)).toBe("warning");
    expect(workloadBand(80)).toBe("warning");
    expect(workloadBand(81)).toBe("danger");
    expect(workloadBand(150)).toBe("danger");
  });

  it("pairs a word with every band, never color alone", () => {
    expect(workloadBandLabel("success")).toBe("On track");
    expect(workloadBandLabel("warning")).toBe("At risk");
    expect(workloadBandLabel("danger")).toBe("Overloaded");
  });
});
