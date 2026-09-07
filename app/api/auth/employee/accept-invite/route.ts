import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiError, serverError, validationError } from "@/lib/api";
import { db } from "@/lib/db";
import { hashInviteToken, isInviteExpired } from "@/lib/invites";
import { hashPassword } from "@/lib/passwords";
import { acceptInviteSchema } from "@/lib/validations/auth";

/**
 * POST /api/auth/employee/accept-invite
 *
 * Completes the invite flow (Architecture.md section 8): the employee proves
 * they hold the one-time token, sets a password, and becomes Active.
 *
 * This route touches the Employee table only — it can never create or modify a
 * CompanyAccount.
 */
export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("Expected a JSON body.", 400, "invalid_json");
  }

  const parsed = acceptInviteSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  const { token, password } = parsed.data;

  try {
    /**
     * Look the invite up by the token's hash. Because `inviteTokenHash` is
     * unique and we never store the plaintext, an attacker with database access
     * still cannot reconstruct a usable link.
     */
    const employee = await db.employee.findUnique({
      where: { inviteTokenHash: hashInviteToken(token) },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        inviteTokenExpiresAt: true,
        company: { select: { slug: true, deletedAt: true } },
      },
    });

    const invalid = apiError(
      "This invite link is not valid. Ask your admin to send a new one.",
      400,
      "invalid_invite"
    );

    if (!employee || employee.deletedAt || employee.company.deletedAt) {
      return invalid;
    }
    if (employee.status === "Suspended") return invalid;
    if (isInviteExpired(employee.inviteTokenExpiresAt)) {
      return apiError(
        "This invite link has expired. Ask your admin to send a new one.",
        410,
        "invite_expired"
      );
    }

    const passwordHash = await hashPassword(password);

    await db.employee.update({
      where: { id: employee.id },
      data: {
        passwordHash,
        status: "Active",
        joinedAt: new Date(),
        // Burn the token so the link cannot be reused.
        inviteTokenHash: null,
        inviteTokenExpiresAt: null,
      },
    });

    return NextResponse.json({ companySlug: employee.company.slug });
  } catch (cause) {
    return serverError(
      { route: "POST /api/auth/employee/accept-invite" },
      cause
    );
  }
}
