import { describe, expect, it } from "vitest";
import {
  agingApprovalAlerts,
  alertSeverityFor,
  overdueTaskAlerts,
  overloadedEmployeeAlerts,
  stalledProjectAlerts,
} from "@/lib/alerts";

const NOW = new Date("2026-09-09T15:30:00.000Z");
const on = (day: string) => new Date(`${day}T00:00:00.000Z`);

describe("alertSeverityFor", () => {
  it("treats an aging approval as the only Critical type", () => {
    expect(alertSeverityFor("AgingApproval")).toBe("Critical");
    expect(alertSeverityFor("OverdueTask")).toBe("Warning");
    expect(alertSeverityFor("OverloadedEmployee")).toBe("Warning");
    expect(alertSeverityFor("StalledProject")).toBe("Warning");
  });
});

describe("overdueTaskAlerts", () => {
  it("flags an overdue task and carries its assignee/project", () => {
    const alerts = overdueTaskAlerts(
      [
        {
          id: "t1",
          title: "Ship it",
          status: "Todo",
          dueDate: on("2026-09-01"),
          assigneeId: "emp1",
          projectId: "proj1",
        },
      ],
      NOW
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      type: "OverdueTask",
      severity: "Warning",
      employeeId: "emp1",
      projectId: "proj1",
    });
  });

  it("ignores a task that is not overdue", () => {
    const alerts = overdueTaskAlerts(
      [
        {
          id: "t1",
          title: "Not due yet",
          status: "Todo",
          dueDate: on("2027-01-01"),
          assigneeId: "emp1",
          projectId: "proj1",
        },
      ],
      NOW
    );
    expect(alerts).toHaveLength(0);
  });

  it("leaves employeeId unset for an unassigned overdue task", () => {
    const alerts = overdueTaskAlerts(
      [
        {
          id: "t1",
          title: "Nobody's job",
          status: "Todo",
          dueDate: on("2026-09-01"),
          assigneeId: null,
          projectId: "proj1",
        },
      ],
      NOW
    );
    expect(alerts[0].employeeId).toBeUndefined();
    expect(alerts[0].projectId).toBe("proj1");
  });
});

describe("overloadedEmployeeAlerts", () => {
  it("flags an employee over the threshold", () => {
    const alerts = overloadedEmployeeAlerts(
      [{ id: "e1", fullName: "Priya", workloadPercent: 92 }],
      80
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      type: "OverloadedEmployee",
      employeeId: "e1",
    });
  });

  it("does not flag an employee at or under the threshold", () => {
    const alerts = overloadedEmployeeAlerts(
      [{ id: "e1", fullName: "Priya", workloadPercent: 80 }],
      80
    );
    expect(alerts).toHaveLength(0);
  });

  it("ignores an employee whose workload has never been computed", () => {
    const alerts = overloadedEmployeeAlerts(
      [{ id: "e1", fullName: "Priya", workloadPercent: null }],
      80
    );
    expect(alerts).toHaveLength(0);
  });
});

describe("stalledProjectAlerts", () => {
  it("flags a still-active project with no recent task activity", () => {
    const alerts = stalledProjectAlerts(
      [
        {
          id: "p1",
          name: "Website",
          status: "Active",
          lastTaskActivityAt: on("2026-08-01"),
        },
      ],
      14,
      NOW
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      type: "StalledProject",
      projectId: "p1",
    });
  });

  it("does not flag a project with recent task activity", () => {
    const alerts = stalledProjectAlerts(
      [
        {
          id: "p1",
          name: "Website",
          status: "Active",
          lastTaskActivityAt: on("2026-09-08"),
        },
      ],
      14,
      NOW
    );
    expect(alerts).toHaveLength(0);
  });

  it("excludes a project with no tasks at all, rather than flagging it from day one", () => {
    const alerts = stalledProjectAlerts(
      [
        {
          id: "p1",
          name: "Not started",
          status: "Active",
          lastTaskActivityAt: null,
        },
      ],
      14,
      NOW
    );
    expect(alerts).toHaveLength(0);
  });

  it("does not flag a Completed or Cancelled project", () => {
    const alerts = stalledProjectAlerts(
      [
        {
          id: "p1",
          name: "Done project",
          status: "Completed",
          lastTaskActivityAt: on("2026-01-01"),
        },
      ],
      14,
      NOW
    );
    expect(alerts).toHaveLength(0);
  });
});

describe("agingApprovalAlerts", () => {
  it("flags a pending request older than the threshold", () => {
    const alerts = agingApprovalAlerts(
      [
        {
          id: "r1",
          subject: "Leave",
          type: "Leave",
          status: "Pending",
          createdAt: on("2026-08-20"),
          employeeId: "e1",
        },
      ],
      5,
      NOW
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      type: "AgingApproval",
      employeeId: "e1",
    });
  });

  it("does not flag a fresh pending request", () => {
    const alerts = agingApprovalAlerts(
      [
        {
          id: "r1",
          subject: "Leave",
          type: "Leave",
          status: "Pending",
          createdAt: on("2026-09-08"),
          employeeId: "e1",
        },
      ],
      5,
      NOW
    );
    expect(alerts).toHaveLength(0);
  });

  it("ignores a request that has already been decided", () => {
    const alerts = agingApprovalAlerts(
      [
        {
          id: "r1",
          subject: "Leave",
          type: "Leave",
          status: "Approved",
          createdAt: on("2026-08-01"),
          employeeId: "e1",
        },
      ],
      5,
      NOW
    );
    expect(alerts).toHaveLength(0);
  });
});
