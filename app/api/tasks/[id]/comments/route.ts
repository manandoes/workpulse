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
import { scopedWhere } from "@/lib/tenant";
import { findTask } from "@/lib/task-data";
import { canViewTasks, isCompanyAdmin } from "@/lib/permissions";
import { commentSchema } from "@/lib/validations/tasks";

/**
 * Comments on a task (Phases.md Phase 5).
 *
 * Commenting needs only the right to *see* the task, not to manage it: a
 * Manager looking at another team's board is exactly the person who should be
 * able to leave a note on it. Changing the task itself still needs
 * `canManageTask`.
 */

/** POST /api/tasks/[id]/comments — add a comment. */
export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/tasks/[id]/comments">
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

  const parsed = commentSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  try {
    // Loaded through the tenant filter, which is what proves the comment lands
    // on a task in the caller's own company (Rules.md section 2).
    const task = await findTask(actor, id);
    if (!task) return apiError("Task not found.", 404, "not_found");

    const comment = await db.comment.create({
      data: {
        companyId: actor.companyId,
        taskId: task.id,
        authorAccountId: actor.id,
        body: parsed.data.body,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        authorAccount: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (cause) {
    return serverError(
      {
        route: "POST /api/tasks/[id]/comments",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}

/**
 * DELETE /api/tasks/[id]/comments?commentId=… — retract a comment.
 *
 * Its author may remove it, and so may an Owner or Admin. It is soft-deleted
 * (Rules.md section 6): a thread records how a decision was reached, so a
 * removed message leaves the rest of the discussion intact and recoverable.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/tasks/[id]/comments">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();
  if (!canViewTasks(actor)) return forbidden();

  const { id } = await context.params;
  const commentId = request.nextUrl.searchParams.get("commentId");
  if (!commentId) {
    return apiError("Name the comment to remove.", 400, "missing_comment");
  }

  try {
    const comment = await db.comment.findFirst({
      where: scopedWhere(actor, { id: commentId, taskId: id }),
      select: { id: true, authorAccountId: true },
    });

    if (!comment) return apiError("Comment not found.", 404, "not_found");

    if (comment.authorAccountId !== actor.id && !isCompanyAdmin(actor)) {
      return forbidden("You can only remove your own comments.");
    }

    await db.comment.update({
      where: { id: comment.id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });

    return NextResponse.json({ deleted: comment.id });
  } catch (cause) {
    return serverError(
      {
        route: "DELETE /api/tasks/[id]/comments",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
