import { describe, expect, it } from "vitest";
import { resolveApproversFor } from "@/lib/notifications";

describe("resolveApproversFor", () => {
  const accounts = [
    { id: "owner_1", role: "Owner" },
    { id: "admin_1", role: "Admin" },
    { id: "hr_1", role: "HR" },
    { id: "mgr_1", role: "Manager" },
    { id: "mgr_2", role: "Manager" },
  ];

  it("always includes Owner, Admin and HR", () => {
    const approvers = resolveApproversFor(accounts, {
      managerAccountId: null,
    });
    expect(approvers.sort()).toEqual(["admin_1", "hr_1", "owner_1"]);
  });

  it("adds the employee's own manager account, but no other Manager", () => {
    const approvers = resolveApproversFor(accounts, {
      managerAccountId: "mgr_1",
    });
    expect(approvers.sort()).toEqual(["admin_1", "hr_1", "mgr_1", "owner_1"]);
    expect(approvers).not.toContain("mgr_2");
  });

  /**
   * A `managerAccountId` naming an Owner/Admin/HR account (an unusual setup,
   * but the schema allows any CompanyAccount to be a manager) must not produce
   * a duplicate entry.
   */
  it("de-duplicates when the manager account is already Owner/Admin/HR", () => {
    const approvers = resolveApproversFor(accounts, {
      managerAccountId: "owner_1",
    });
    expect(approvers.filter((id) => id === "owner_1")).toHaveLength(1);
  });

  it("ignores a manager account id that does not exist in the company", () => {
    const approvers = resolveApproversFor(accounts, {
      managerAccountId: "ghost",
    });
    expect(approvers.sort()).toEqual(["admin_1", "hr_1", "owner_1"]);
  });
});
