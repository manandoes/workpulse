import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiError, serverError, unauthorized, validationError } from "@/lib/api";
import { getActor } from "@/lib/auth";
import { db } from "@/lib/db";
import { avatarUploadSchema } from "@/lib/validations/profile";

/**
 * PATCH /api/profile/avatar — set the signed-in user's own profile photo.
 * DELETE /api/profile/avatar — remove it.
 *
 * Always acts on the caller's own record (`actor.id`), never a body-supplied
 * id, so there is no separate authorization check to get wrong here.
 */
export async function PATCH(request: NextRequest) {
  const actor = await getActor();
  if (!actor) return unauthorized();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("Expected a JSON body.", 400, "invalid_json");
  }

  const parsed = avatarUploadSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  try {
    await setAvatar(actor, parsed.data.avatarUrl);
    return NextResponse.json({ avatarUrl: parsed.data.avatarUrl });
  } catch (cause) {
    return serverError(
      { route: "PATCH /api/profile/avatar", companyId: actor.companyId, actorId: actor.id },
      cause
    );
  }
}

export async function DELETE() {
  const actor = await getActor();
  if (!actor) return unauthorized();

  try {
    await setAvatar(actor, null);
    return NextResponse.json({ avatarUrl: null });
  } catch (cause) {
    return serverError(
      { route: "DELETE /api/profile/avatar", companyId: actor.companyId, actorId: actor.id },
      cause
    );
  }
}

/**
 * `actor.id` always names a record in the caller's own company — it comes
 * from their own authenticated session, never from a request body — so a
 * plain id lookup is safe here without an extra `scopedWhere` tenant check.
 */
async function setAvatar(
  actor: { id: string; accountType: "company" | "employee" },
  avatarUrl: string | null
) {
  if (actor.accountType === "company") {
    await db.companyAccount.update({
      where: { id: actor.id },
      data: { avatarUrl },
    });
  } else {
    await db.employee.update({
      where: { id: actor.id },
      data: { avatarUrl },
    });
  }
}
