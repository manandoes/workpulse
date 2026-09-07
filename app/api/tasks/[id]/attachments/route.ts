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
import { findTask } from "@/lib/task-data";
import { canManageTask, canViewTasks } from "@/lib/permissions";
import { attachmentLabel } from "@/lib/tasks";
import { attachmentSchema } from "@/lib/validations/tasks";

/**
 * Attachments on a task (Phases.md Phase 5).
 *
 * Phase 5 attaches a **link** to a file rather than an upload: the S3 bucket
 * Architecture.md section 2 calls for is not provisioned (the `S3_*` variables
 * are blank), and inventing a second storage home for files would be undone the
 * moment it is. See the `Attachment` model for how an upload slots in later.
 *
 * The link is validated to http/https before it is stored, never only when it
 * is rendered (Architecture.md section 8).
 */

/** POST /api/tasks/[id]/attachments — attach a link. */
export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/tasks/[id]/attachments">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();
  if (!canViewTasks(actor)) return forbidden();

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
    const task = await findTask(actor, id);
    if (!task) return apiError("Task not found.", 404, "not_found");

    const attachment = await db.attachment.create({
      data: {
        companyId: actor.companyId,
        taskId: task.id,
        addedById: actor.id,
        url: parsed.data.url.trim(),
        // Naming it is optional; the file name in the link is a better default
        // than showing 200 characters of URL in a list.
        label: attachmentLabel(parsed.data.url, parsed.data.label),
      },
      select: {
        id: true,
        label: true,
        url: true,
        createdAt: true,
        addedBy: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (cause) {
    return serverError(
      {
        route: "POST /api/tasks/[id]/attachments",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}

/**
 * DELETE /api/tasks/[id]/attachments?attachmentId=… — remove a link.
 *
 * Whoever added it may remove it, and so may anyone who manages the task. Like
 * `ProjectMember`, this row is a pointer rather than a history, so removing it
 * is a real delete — there is nothing left to keep once the link is gone.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/tasks/[id]/attachments">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();
  if (!canViewTasks(actor)) return forbidden();

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
    const task = await findTask(actor, id);
    if (!task) return apiError("Task not found.", 404, "not_found");

    const attachment = await db.attachment.findFirst({
      /**
       * Not read through `scopedWhere`: an attachment has no `deletedAt` to
       * filter on. The tenant is proven twice over anyway — by the task, which
       * was loaded through the tenant filter, and by the company on the row.
       */
      where: { id: attachmentId, taskId: task.id, companyId: actor.companyId },
      select: { id: true, addedById: true },
    });

    if (!attachment) {
      return apiError("Attachment not found.", 404, "not_found");
    }

    if (attachment.addedById !== actor.id && !canManageTask(actor, task)) {
      return forbidden("You can only remove attachments you added.");
    }

    await db.attachment.delete({ where: { id: attachment.id } });

    return NextResponse.json({ deleted: attachment.id });
  } catch (cause) {
    return serverError(
      {
        route: "DELETE /api/tasks/[id]/attachments",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
