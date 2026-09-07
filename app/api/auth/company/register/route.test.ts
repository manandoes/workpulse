import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { uniqueSuffix, jsonRequest } from "@/lib/test-helpers";
import { POST } from "./route";

describe("POST /api/auth/company/register", () => {
  it("creates a company plus its Owner account", async () => {
    const suffix = uniqueSuffix();

    const response = await POST(
      jsonRequest("http://localhost/api/auth/company/register", "POST", {
        companyName: `Registered Co ${suffix}`,
        fullName: "Founding Owner",
        workEmail: `founder-${suffix}@example.com`,
        password: "a-strong-password",
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.workEmail).toBe(`founder-${suffix}@example.com`);

    const account = await db.companyAccount.findFirst({
      where: { workEmail: `founder-${suffix}@example.com` },
      select: {
        role: true,
        passwordHash: true,
        company: { select: { slug: true } },
      },
    });
    expect(account?.role).toBe("Owner");
    expect(account?.passwordHash).not.toBeNull();
    expect(account?.company.slug).toBe(body.company.slug);
  });

  it("400s a body that fails validation", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/auth/company/register", "POST", {
        companyName: "A",
        fullName: "",
        workEmail: "not-an-email",
        password: "short",
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("validation_error");
  });
});
