import { beforeEach, describe, expect, it, vi } from "vitest";
import { getActor } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  companyActor,
  createEmployee,
  createTestCompany,
  employeeActor,
  jsonRequest,
} from "@/lib/test-helpers";
import { POST } from "./route";

vi.mock("@/lib/auth", () => ({ getActor: vi.fn() }));

describe("POST /api/requests", () => {
  beforeEach(() => {
    vi.mocked(getActor).mockReset();
  });

  it("lets an employee submit a leave request", async () => {
    const { companyId } = await createTestCompany();
    const employeeId = await createEmployee(companyId);
    vi.mocked(getActor).mockResolvedValue(employeeActor(companyId, employeeId));

    const response = await POST(
      jsonRequest("http://localhost/api/requests", "POST", {
        type: "Leave",
        subject: "Annual leave",
        description: "A week off",
        startDate: "2026-10-01",
        endDate: "2026-10-05",
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.request.status).toBe("Pending");

    const stored = await db.request.findUnique({
      where: { id: body.request.id },
    });
    expect(stored?.employeeId).toBe(employeeId);
  });

  it("400s a Leave request missing its date range", async () => {
    const { companyId } = await createTestCompany();
    const employeeId = await createEmployee(companyId);
    vi.mocked(getActor).mockResolvedValue(employeeActor(companyId, employeeId));

    const response = await POST(
      jsonRequest("http://localhost/api/requests", "POST", {
        type: "Leave",
        subject: "Annual leave",
        description: "A week off",
      })
    );

    expect(response.status).toBe(400);
  });

  it("refuses a company account submitting a request", async () => {
    const { companyId, ownerId } = await createTestCompany();
    vi.mocked(getActor).mockResolvedValue(
      companyActor(companyId, ownerId, "Owner")
    );

    const response = await POST(
      jsonRequest("http://localhost/api/requests", "POST", {
        type: "HR",
        subject: "Question",
        description: "Just a question",
      })
    );

    expect(response.status).toBe(403);
  });
});
