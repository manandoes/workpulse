import { beforeEach, describe, expect, it, vi } from "vitest";
import { getActor } from "@/lib/auth";
import {
  companyActor,
  createCompanyAccount,
  createEmployee,
  createTestCompany,
  jsonRequest,
} from "@/lib/test-helpers";
import { POST } from "./route";

vi.mock("@/lib/auth", () => ({ getActor: vi.fn() }));

describe("POST /api/performance/[employeeId]/feedback", () => {
  beforeEach(() => {
    vi.mocked(getActor).mockReset();
  });

  it("lets a Manager give feedback to their direct report", async () => {
    const { companyId } = await createTestCompany();
    const managerId = await createCompanyAccount(companyId, "Manager");
    const employeeId = await createEmployee(companyId, {
      managerAccountId: managerId,
    });
    vi.mocked(getActor).mockResolvedValue(
      companyActor(companyId, managerId, "Manager")
    );

    const response = await POST(
      jsonRequest(
        `http://localhost/api/performance/${employeeId}/feedback`,
        "POST",
        { rating: "4", body: "Great quarter" }
      ),
      { params: Promise.resolve({ employeeId }) }
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.feedback).toMatchObject({ rating: 4, body: "Great quarter" });
  });

  it("refuses a Manager who is not this employee's manager", async () => {
    const { companyId } = await createTestCompany();
    const managerId = await createCompanyAccount(companyId, "Manager");
    const employeeId = await createEmployee(companyId);
    vi.mocked(getActor).mockResolvedValue(
      companyActor(companyId, managerId, "Manager")
    );

    const response = await POST(
      jsonRequest(
        `http://localhost/api/performance/${employeeId}/feedback`,
        "POST",
        { rating: "3", body: "Not your report" }
      ),
      { params: Promise.resolve({ employeeId }) }
    );

    expect(response.status).toBe(403);
  });
});
