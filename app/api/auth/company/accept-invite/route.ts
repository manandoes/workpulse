import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiError, serverError, validationError } from "@/lib/api";
import { db } from "@/lib/db";
import { hashInviteToken, isInviteExpired } from "@/lib/invites";
import { hashPassword } from "@/lib/passwords";
import { acceptInviteSchema } from "@/lib/validations/auth";

/**
 * POST /api/auth/company/accept-invite
 *
 * The company-account half of the invite flow: an invited Admin, Manager or HR
 * user proves they hold the one-time token and sets their password.
 *
 * Mirrors the employee route deliberately. Architecture.md section 8: this one
 * touches the CompanyAccount table only, and the employee route touches the
 * Employee table only — neither can ever create or modify the other.
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
    const account = await db.companyAccount.findUnique({
      where: { inviteTokenHash: hashInviteToken(token) },
      select: {
        id: true,
        workEmail: true,
        deletedAt: true,
        inviteTokenExpiresAt: true,
        company: { select: { slug: true, deletedAt: true } },
      },
    });

    const invalid = apiError(
      "This invite link is not valid. Ask an admin to send a new one.",
      400,
      "invalid_invite"
    );

    if (!account || account.deletedAt || account.company.deletedAt) {
      return invalid;
    }

    if (isInviteExpired(account.inviteTokenExpiresAt)) {
      return apiError(
        "This invite link has expired. Ask an admin to send a new one.",
        410,
        "invite_expired"
      );
    }

    const passwordHash = await hashPassword(password);

    await db.companyAccount.update({
      where: { id: account.id },
      data: {
        passwordHash,
        // Burn the token so the link cannot be reused.
        inviteTokenHash: null,
        inviteTokenExpiresAt: null,
      },
    });

    return NextResponse.json({
      workEmail: account.workEmail,
      companySlug: account.company.slug,
    });
  } catch (cause) {
    return serverError(
      { route: "POST /api/auth/company/accept-invite" },
      cause
    );
  }
}
