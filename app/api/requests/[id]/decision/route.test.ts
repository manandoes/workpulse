import { beforeEach, describe, expect, it, vi } from "vitest";
import { getActor } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  companyActor,
  createCompanyAccount,
  createEmployee,
  createTestCompany,
  jsonRequest,
} from "@/lib/test-helpers";
import { PATCH } from "./route";

vi.mock("@/lib/auth", () => ({ getActor: vi.fn() }));

async function createPendingRequest(companyId: string, employeeId: string) {
  const request = await db.request.create({
    data: {
      companyId,
      employeeId,
      type: "HR",
      subject: "A question",
      description: "Needs an answer",
    },
    select: { id: true },
  });
  return request.id;
}

describe("PATCH /api/requests/[id]/decision", () => {
  beforeEach(() => {
    vi.mocked(getActor).mockReset();
  });

  it("lets a Manager approve their direct report's request", async () => {
    const { companyId } = await createTestCompany();
    const managerId = await createCompanyAccount(companyId, "Manager");
    const employeeId = await createEmployee(companyId, {
      managerAccountId: managerId,
    });
    const requestId = await createPendingRequest(companyId, employeeId);
    vi.mocked(getActor).mockResolvedValue(
      companyActor(companyId, managerId, "Manager")
    );

    const response = await PATCH(
      jsonRequest(
        `http://localhost/api/requests/${requestId}/decision`,
        "PATCH",
        { status: "Approved", decisionNote: "Looks good" }
      ),
      { params: Promise.resolve({ id: requestId }) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.request.status).toBe("Approved");
  });

  it("refuses a Manager deciding on an employee who is not their report", async () => {
    const { companyId } = await createTestCompany();
    const managerId = await createCompanyAccount(companyId, "Manager");
    const employeeId = await createEmployee(companyId);
    const requestId = await createPendingRequest(companyId, employeeId);
    vi.mocked(getActor).mockResolvedValue(
      companyActor(companyId, managerId, "Manager")
    );

    const response = await PATCH(
      jsonRequest(
        `http://localhost/api/requests/${requestId}/decision`,
        "PATCH",
        { status: "Approved" }
      ),
      { params: Promise.resolve({ id: requestId }) }
    );

    expect(response.status).toBe(403);
  });

  it("409s a request that has already been decided", async () => {
    const { companyId, ownerId } = await createTestCompany();
    const employeeId = await createEmployee(companyId);
    const requestId = await createPendingRequest(companyId, employeeId);
    vi.mocked(getActor).mockResolvedValue(
      companyActor(companyId, ownerId, "Owner")
    );

    const first = await PATCH(
      jsonRequest(
        `http://localhost/api/requests/${requestId}/decision`,
        "PATCH",
        { status: "Rejected" }
      ),
      { params: Promise.resolve({ id: requestId }) }
    );
    expect(first.status).toBe(200);

    const second = await PATCH(
      jsonRequest(
        `http://localhost/api/requests/${requestId}/decision`,
        "PATCH",
        { status: "Approved" }
      ),
      { params: Promise.resolve({ id: requestId }) }
    );

    expect(second.status).toBe(409);
    const body = await second.json();
    expect(body.code).toBe("already_decided");
  });
});
