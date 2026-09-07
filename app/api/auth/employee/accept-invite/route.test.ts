import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  generateInviteToken,
  hashInviteToken,
  inviteExpiryFrom,
} from "@/lib/invites";
import {
  createEmployee,
  createTestCompany,
  jsonRequest,
} from "@/lib/test-helpers";
import { POST } from "./route";

async function inviteEmployee(companyId: string) {
  const employeeId = await createEmployee(companyId);
  const token = generateInviteToken();
  await db.employee.update({
    where: { id: employeeId },
    data: {
      inviteTokenHash: hashInviteToken(token),
      inviteTokenExpiresAt: inviteExpiryFrom(),
    },
  });
  return { employeeId, token };
}

describe("POST /api/auth/employee/accept-invite", () => {
  it("activates the employee and burns the token", async () => {
    const { companyId } = await createTestCompany();
    const { employeeId, token } = await inviteEmployee(companyId);

    const response = await POST(
      jsonRequest("http://localhost/api/auth/employee/accept-invite", "POST", {
        token,
        password: "a-strong-password",
      })
    );

    expect(response.status).toBe(200);

    const stored = await db.employee.findUnique({ where: { id: employeeId } });
    expect(stored?.status).toBe("Active");
    expect(stored?.passwordHash).not.toBeNull();
    expect(stored?.inviteTokenHash).toBeNull();
  });

  it("rejects a suspended employee's invite", async () => {
    const { companyId } = await createTestCompany();
    const { employeeId, token } = await inviteEmployee(companyId);
    await db.employee.update({
      where: { id: employeeId },
      data: { status: "Suspended" },
    });

    const response = await POST(
      jsonRequest("http://localhost/api/auth/employee/accept-invite", "POST", {
        token,
        password: "a-strong-password",
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("invalid_invite");
  });

  it("rejects an unknown token", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/auth/employee/accept-invite", "POST", {
        token: "not-a-real-token",
        password: "a-strong-password",
      })
    );

    expect(response.status).toBe(400);
  });
});
