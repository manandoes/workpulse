import { beforeEach, describe, expect, it, vi } from "vitest";
import { getActor } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  companyActor,
  createCompanyAccount,
  createTestCompany,
  jsonRequest,
} from "@/lib/test-helpers";
import { PATCH } from "./route";

vi.mock("@/lib/auth", () => ({ getActor: vi.fn() }));

describe("PATCH /api/settings/alerts", () => {
  beforeEach(() => {
    vi.mocked(getActor).mockReset();
  });

  it("lets an Owner change the alert thresholds", async () => {
    const { companyId, ownerId } = await createTestCompany();
    vi.mocked(getActor).mockResolvedValue(
      companyActor(companyId, ownerId, "Owner")
    );

    const response = await PATCH(
      jsonRequest("http://localhost/api/settings/alerts", "PATCH", {
        overloadThresholdPercent: "90",
        stalledProjectDays: "10",
        agingApprovalDays: "3",
      })
    );

    expect(response.status).toBe(200);
    const stored = await db.company.findUnique({ where: { id: companyId } });
    expect(stored?.overloadThresholdPercent).toBe(90);
    expect(stored?.stalledProjectDays).toBe(10);
    expect(stored?.agingApprovalDays).toBe(3);
  });

  it("refuses a Manager (narrower than the workload-capacity setting)", async () => {
    const { companyId } = await createTestCompany();
    const managerId = await createCompanyAccount(companyId, "Manager");
    vi.mocked(getActor).mockResolvedValue(
      companyActor(companyId, managerId, "Manager")
    );

    const response = await PATCH(
      jsonRequest("http://localhost/api/settings/alerts", "PATCH", {
        overloadThresholdPercent: "90",
        stalledProjectDays: "10",
        agingApprovalDays: "3",
      })
    );

    expect(response.status).toBe(403);
  });
});
