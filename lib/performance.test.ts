import { describe, expect, it } from "vitest";
import {
  calculatePerformanceScore,
  feedbackContribution,
  goalContribution,
  onTimeDeliveryRate,
  PERFORMANCE_WEIGHTS,
  performanceBand,
  performanceBandLabel,
  taskCompletionRate,
  workloadContribution,
} from "@/lib/performance";

const due = (day: string) => new Date(`${day}T00:00:00.000Z`);

describe("taskCompletionRate", () => {
  it("is null for someone never assigned a task", () => {
    expect(taskCompletionRate([])).toBeNull();
  });

  it("is the share of ever-assigned tasks that reached Done", () => {
    const rate = taskCompletionRate([
      { status: "Done", dueDate: null, completedAt: null },
      { status: "Todo", dueDate: null, completedAt: null },
      { status: "InProgress", dueDate: null, completedAt: null },
      { status: "Done", dueDate: null, completedAt: null },
    ]);
    expect(rate).toBe(50);
  });
});

describe("onTimeDeliveryRate", () => {
  it("is null when nothing has reached Done yet", () => {
    expect(
      onTimeDeliveryRate([{ status: "Todo", dueDate: null, completedAt: null }])
    ).toBeNull();
  });

  it("counts a Done task with no due date as on time", () => {
    const rate = onTimeDeliveryRate([
      { status: "Done", dueDate: null, completedAt: due("2026-09-01") },
    ]);
    expect(rate).toBe(100);
  });

  it("counts finishing on or before the due date as on time", () => {
    const rate = onTimeDeliveryRate([
      {
        status: "Done",
        dueDate: due("2026-09-10"),
        completedAt: due("2026-09-10"),
      },
    ]);
    expect(rate).toBe(100);
  });

  it("counts finishing after the due date as late", () => {
    const rate = onTimeDeliveryRate([
      {
        status: "Done",
        dueDate: due("2026-09-10"),
        completedAt: due("2026-09-12"),
      },
      {
        status: "Done",
        dueDate: due("2026-09-10"),
        completedAt: due("2026-09-10"),
      },
    ]);
    expect(rate).toBe(50);
  });

  it("ignores tasks that never reached Done", () => {
    const rate = onTimeDeliveryRate([
      {
        status: "Done",
        dueDate: due("2026-09-10"),
        completedAt: due("2026-09-10"),
      },
      { status: "Todo", dueDate: due("2026-01-01"), completedAt: null },
    ]);
    expect(rate).toBe(100);
  });
});

describe("workloadContribution", () => {
  it("is null when workload has never been computed", () => {
    expect(workloadContribution(null)).toBeNull();
  });

  it("passes through a workload at or below capacity", () => {
    expect(workloadContribution(55)).toBe(55);
  });

  it("caps an overloaded workload at 100 rather than rewarding overload", () => {
    expect(workloadContribution(150)).toBe(100);
  });
});

describe("feedbackContribution", () => {
  it("is null when nobody has given feedback yet", () => {
    expect(feedbackContribution([])).toBeNull();
  });

  it("scales the average rating from 1-5 to 0-100", () => {
    expect(feedbackContribution([5])).toBe(100);
    expect(feedbackContribution([1])).toBe(0);
    expect(feedbackContribution([3])).toBe(50);
  });

  it("averages multiple ratings", () => {
    expect(feedbackContribution([5, 1])).toBe(50);
  });
});

describe("goalContribution", () => {
  it("is null with no goals at all", () => {
    expect(goalContribution([])).toBeNull();
  });

  it("is null when every goal is still Active", () => {
    expect(goalContribution([{ status: "Active" }])).toBeNull();
  });

  it("excludes Active goals from the ratio, decided goals only", () => {
    const contribution = goalContribution([
      { status: "Active" },
      { status: "Achieved" },
      { status: "Missed" },
    ]);
    expect(contribution).toBe(50);
  });

  it("is 100 when every decided goal was achieved", () => {
    expect(
      goalContribution([{ status: "Achieved" }, { status: "Achieved" }])
    ).toBe(100);
  });
});

describe("calculatePerformanceScore", () => {
  it("is null when there is nothing at all to score", () => {
    const score = calculatePerformanceScore({
      tasks: [],
      workloadPercent: null,
      feedbackRatings: [],
      goals: [],
    });
    expect(score).toBeNull();
  });

  it("scores purely from tasks when nothing else exists yet", () => {
    const score = calculatePerformanceScore({
      tasks: [{ status: "Done", dueDate: null, completedAt: null }],
      workloadPercent: null,
      feedbackRatings: [],
      goals: [],
    });
    // completion 100, on-time 100 — both weighted equally against each other
    // once workload/feedback/goals are renormalized out.
    expect(score).toBe(100);
  });

  it("renormalizes weights so a missing component doesn't drag the score down", () => {
    // Every present component reads 100; a missing feedback/goals component
    // must not pull the result below that.
    const score = calculatePerformanceScore({
      tasks: [
        {
          status: "Done",
          dueDate: due("2026-09-10"),
          completedAt: due("2026-09-09"),
        },
      ],
      workloadPercent: 100,
      feedbackRatings: [],
      goals: [],
    });
    expect(score).toBe(100);
  });

  it("weighs completion and on-time delivery as specified", () => {
    const score = calculatePerformanceScore({
      tasks: [{ status: "Done", dueDate: null, completedAt: null }],
      workloadPercent: 0,
      feedbackRatings: [1],
      goals: [{ status: "Missed" }],
    });
    const expected =
      (100 * PERFORMANCE_WEIGHTS.completion +
        100 * PERFORMANCE_WEIGHTS.onTime +
        0 * PERFORMANCE_WEIGHTS.workload +
        0 * PERFORMANCE_WEIGHTS.feedback +
        0 * PERFORMANCE_WEIGHTS.goals) /
      (PERFORMANCE_WEIGHTS.completion +
        PERFORMANCE_WEIGHTS.onTime +
        PERFORMANCE_WEIGHTS.workload +
        PERFORMANCE_WEIGHTS.feedback +
        PERFORMANCE_WEIGHTS.goals);
    expect(score).toBe(Math.round(expected * 100) / 100);
  });
});

describe("performanceBand", () => {
  it("matches the documented thresholds", () => {
    expect(performanceBand(0)).toBe("danger");
    expect(performanceBand(39)).toBe("danger");
    expect(performanceBand(40)).toBe("warning");
    expect(performanceBand(69)).toBe("warning");
    expect(performanceBand(70)).toBe("success");
    expect(performanceBand(100)).toBe("success");
  });

  it("pairs a word with every band, never color alone", () => {
    expect(performanceBandLabel("success")).toBe("Strong");
    expect(performanceBandLabel("warning")).toBe("Steady");
    expect(performanceBandLabel("danger")).toBe("Needs support");
  });
});
