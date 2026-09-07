import { describe, expect, it } from "vitest";
import {
  REQUEST_TYPES,
  requestFilter,
  requestNeedsAmount,
  requestNeedsDateRange,
  requestStatusLabel,
  requestTypeLabel,
} from "@/lib/requests";

describe("requestNeedsDateRange", () => {
  it("is true only for Leave and WFH", () => {
    expect(requestNeedsDateRange("Leave")).toBe(true);
    expect(requestNeedsDateRange("WFH")).toBe(true);
    for (const type of REQUEST_TYPES.filter(
      (t) => t !== "Leave" && t !== "WFH"
    )) {
      expect(requestNeedsDateRange(type)).toBe(false);
    }
  });
});

describe("requestNeedsAmount", () => {
  it("is true only for Reimbursement", () => {
    expect(requestNeedsAmount("Reimbursement")).toBe(true);
    for (const type of REQUEST_TYPES.filter((t) => t !== "Reimbursement")) {
      expect(requestNeedsAmount(type)).toBe(false);
    }
  });
});

describe("labels", () => {
  it("gives every type and status a human label", () => {
    for (const type of REQUEST_TYPES) {
      expect(requestTypeLabel(type).length).toBeGreaterThan(0);
    }
    expect(requestStatusLabel("Pending")).toBe("Pending");
    expect(requestStatusLabel("Approved")).toBe("Approved");
    expect(requestStatusLabel("Rejected")).toBe("Rejected");
  });
});

describe("requestFilter", () => {
  it("builds nothing from empty filters", () => {
    expect(requestFilter({})).toEqual({});
  });

  it("filters by status, type and employee", () => {
    expect(
      requestFilter({ status: "Pending", type: "Leave", employeeId: "emp_1" })
    ).toEqual({ status: "Pending", type: "Leave", employeeId: "emp_1" });
  });

  it("searches subject, description and employee name", () => {
    const where = requestFilter({ q: "laptop" }) as { OR: unknown[] };
    expect(where.OR).toHaveLength(3);
  });
});
