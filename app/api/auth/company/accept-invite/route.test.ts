import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  generateInviteToken,
  hashInviteToken,
  inviteExpiryFrom,
} from "@/lib/invites";
import {
  createCompanyAccount,
  createTestCompany,
  jsonRequest,
} from "@/lib/test-helpers";
import { POST } from "./route";

async function inviteCompanyAccount(companyId: string) {
  const accountId = await createCompanyAccount(companyId, "Admin");
  const token = generateInviteToken();
  await db.companyAccount.update({
    where: { id: accountId },
    data: {
      inviteTokenHash: hashInviteToken(token),
      inviteTokenExpiresAt: inviteExpiryFrom(),
    },
  });
  return { accountId, token };
}

describe("POST /api/auth/company/accept-invite", () => {
  it("sets a password and burns the token", async () => {
    const { companyId } = await createTestCompany();
    const { accountId, token } = await inviteCompanyAccount(companyId);

    const response = await POST(
      jsonRequest("http://localhost/api/auth/company/accept-invite", "POST", {
        token,
        password: "a-strong-password",
      })
    );

    expect(response.status).toBe(200);

    const stored = await db.companyAccount.findUnique({
      where: { id: accountId },
    });
    expect(stored?.passwordHash).not.toBeNull();
    expect(stored?.inviteTokenHash).toBeNull();
  });

  it("rejects an unknown token", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/auth/company/accept-invite", "POST", {
        token: "not-a-real-token",
        password: "a-strong-password",
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("invalid_invite");
  });

  it("rejects an expired token", async () => {
    const { companyId } = await createTestCompany();
    const accountId = await createCompanyAccount(companyId, "Admin");
    const token = generateInviteToken();
    await db.companyAccount.update({
      where: { id: accountId },
      data: {
        inviteTokenHash: hashInviteToken(token),
        inviteTokenExpiresAt: new Date(Date.now() - 1000),
      },
    });

    const response = await POST(
      jsonRequest("http://localhost/api/auth/company/accept-invite", "POST", {
        token,
        password: "a-strong-password",
      })
    );

    expect(response.status).toBe(410);
  });

  it("cannot be replayed once the token has been used", async () => {
    const { companyId } = await createTestCompany();
    const { token } = await inviteCompanyAccount(companyId);

    const first = await POST(
      jsonRequest("http://localhost/api/auth/company/accept-invite", "POST", {
        token,
        password: "a-strong-password",
      })
    );
    expect(first.status).toBe(200);

    const second = await POST(
      jsonRequest("http://localhost/api/auth/company/accept-invite", "POST", {
        token,
        password: "a-different-password",
      })
    );
    expect(second.status).toBe(400);
  });
});
