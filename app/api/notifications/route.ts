import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { serverError, unauthorized } from "@/lib/api";
import { getActor } from "@/lib/auth";
import {
  loadNotifications,
  loadNotificationsPage,
  markAllNotificationsRead,
  unreadNotificationCount,
} from "@/lib/notification-data";

/**
 * GET /api/notifications — the bell's dropdown content (Architecture.md
 * section 7), or, with a `page` param, the full paginated history the new
 * `/notifications` page reads (Phases.md Phase 12).
 *
 * Works for either account type: the recipient column `lib/notification-data.ts`
 * queries follows `actor.accountType`, so an employee and a company account
 * hit the same route for their own notifications.
 */
export async function GET(request: NextRequest) {
  const actor = await getActor();
  if (!actor) return unauthorized();

  try {
    const pageParam = request.nextUrl.searchParams.get("page");
    if (pageParam !== null) {
      const requestedPage = Math.max(1, Number(pageParam) || 1);
      const { notifications, total, page, pageCount } =
        await loadNotificationsPage(actor, requestedPage);
      return NextResponse.json({ notifications, total, page, pageCount });
    }

    const [notifications, unreadCount] = await Promise.all([
      loadNotifications(actor),
      unreadNotificationCount(actor),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (cause) {
    return serverError(
      {
        route: "GET /api/notifications",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}

/** PATCH /api/notifications — mark every one of the actor's own notifications read. */
export async function PATCH() {
  const actor = await getActor();
  if (!actor) return unauthorized();

  try {
    await markAllNotificationsRead(actor);
    return NextResponse.json({ ok: true });
  } catch (cause) {
    return serverError(
      {
        route: "PATCH /api/notifications",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
