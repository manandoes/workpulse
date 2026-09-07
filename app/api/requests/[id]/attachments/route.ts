import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  apiError,
  forbidden,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api";
import { getActor } from "@/lib/auth";
import { db } from "@/lib/db";
import { findRequest, type LoadedRequest } from "@/lib/request-data";
import { canDecideOnRequest, type SessionActor } from "@/lib/permissions";
import { attachmentLabel } from "@/lib/tasks";
import { attachmentSchema } from "@/lib/validations/requests";

/**
 * Attachments on a request (Phases.md Phase 7, mirrors
 * `app/api/tasks/[id]/attachments/route.ts`).
 *
 * A link only, for the same reason tasks store one: the S3 bucket
 * Architecture.md section 2 calls for is not provisioned. Allowed for the
 * request's own employee (who is submitting evidence, a receipt, a form) or
 * whoever may decide on it — nobody else in the company can see or touch a
 * request that is not theirs to submit or approve.
 */

function canTouch(actor: SessionActor, request: LoadedRequest): boolean {
  if (actor.accountType === "employee") {
    return request.employee.id === actor.id;
  }
  return canDecideOnRequest(actor, request);
}

/** POST /api/requests/[id]/attachments — attach a link. */
export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/requests/[id]/attachments">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();

  const { id } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("Expected a JSON body.", 400, "invalid_json");
  }

  const parsed = attachmentSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const found = await findRequest(actor, id);
    if (!found) return apiError("Request not found.", 404, "not_found");
    if (!canTouch(actor, found)) return forbidden();

    const attachment = await db.attachment.create({
      data: {
        companyId: actor.companyId,
        requestId: found.id,
        ...(actor.accountType === "employee"
          ? { addedByEmployeeId: actor.id }
          : { addedById: actor.id }),
        url: parsed.data.url.trim(),
        label: attachmentLabel(parsed.data.url, parsed.data.label),
      },
      select: {
        id: true,
        label: true,
        url: true,
        createdAt: true,
        addedById: true,
        addedByEmployeeId: true,
        addedBy: { select: { id: true, fullName: true } },
        addedByEmployee: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (cause) {
    return serverError(
      {
        route: "POST /api/requests/[id]/attachments",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}

/**
 * DELETE /api/requests/[id]/attachments?attachmentId=… — remove a link.
 *
 * Whoever added it may remove it, and so may anyone who may decide on the
 * request. Like the task version, this is a pointer rather than a history, so
 * removing it is a real delete.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/requests/[id]/attachments">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();

  const { id } = await context.params;
  const attachmentId = request.nextUrl.searchParams.get("attachmentId");
  if (!attachmentId) {
    return apiError(
      "Name the attachment to remove.",
      400,
      "missing_attachment"
    );
  }

  try {
    const found = await findRequest(actor, id);
    if (!found) return apiError("Request not found.", 404, "not_found");
    if (!canTouch(actor, found)) return forbidden();

    const attachment = await db.attachment.findFirst({
      where: {
        id: attachmentId,
        requestId: found.id,
        companyId: actor.companyId,
      },
      select: { id: true, addedById: true, addedByEmployeeId: true },
    });

    if (!attachment) {
      return apiError("Attachment not found.", 404, "not_found");
    }

    const addedByCaller =
      (actor.accountType === "employee" &&
        attachment.addedByEmployeeId === actor.id) ||
      (actor.accountType === "company" && attachment.addedById === actor.id);

    if (!addedByCaller && !canDecideOnRequest(actor, found)) {
      return forbidden("You can only remove attachments you added.");
    }

    await db.attachment.delete({ where: { id: attachment.id } });

    return NextResponse.json({ deleted: attachment.id });
  } catch (cause) {
    return serverError(
      {
        route: "DELETE /api/requests/[id]/attachments",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
