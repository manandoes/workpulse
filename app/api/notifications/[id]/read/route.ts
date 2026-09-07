import { NextResponse } from "next/server";
import { serverError, unauthorized } from "@/lib/api";
import { getActor } from "@/lib/auth";
import { markNotificationRead } from "@/lib/notification-data";

/**
 * PATCH /api/notifications/[id]/read — mark one notification read.
 *
 * `markNotificationRead` scopes its `updateMany` to the actor's own
 * recipient column, so naming another person's notification id here quietly
 * updates nothing rather than leaking whether it exists.
 */
export async function PATCH(
  _request: Request,
  context: RouteContext<"/api/notifications/[id]/read">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();

  const { id } = await context.params;

  try {
    await markNotificationRead(actor, id);
    return NextResponse.json({ ok: true });
  } catch (cause) {
    return serverError(
      {
        route: "PATCH /api/notifications/[id]/read",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
