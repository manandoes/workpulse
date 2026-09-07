import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  apiError,
  forbidden,
  serverError,
  unauthorized,
  validationError,
  writeFailure,
} from "@/lib/api";
import { getActor } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  findTask,
  findTaskProject,
  resolveTaskWrite,
  unknownProject,
} from "@/lib/task-data";
import { canManageTask } from "@/lib/permissions";
import { updateTaskSchema } from "@/lib/validations/tasks";
import { safeRecalcEmployeeWorkload } from "@/lib/workload-data";
import { safeRecalcEmployeePerformance } from "@/lib/performance-data";

/**
 * PATCH /api/tasks/[id] — edit a task.
 *
 * Owner and Admin may edit any task in their company; a Manager may edit the
 * tasks on the projects they lead (PRD.md section 9 — "manage own team's
 * tasks").
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/tasks/[id]">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();
  if (actor.accountType !== "company") return forbidden();

  const { id } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("Expected a JSON body.", 400, "invalid_json");
  }

  const parsed = updateTaskSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  try {
    /**
     * Loaded through the tenant filter, so an id from another company reads as
     * "not found" rather than leaking that the record exists at all
     * (Rules.md section 2).
     */
    const task = await findTask(actor, id);
    if (!task) return apiError("Task not found.", 404, "not_found");

    if (!canManageTask(actor, task)) {
      return forbidden("You can only edit tasks on projects you lead.");
    }

    /**
     * Moving a task to another project needs the right to write on *both*
     * sides. Checking only the one it came from would let a Manager push work
     * onto a team they do not run.
     */
    let project = task.project;
    if (parsed.data.projectId !== task.project.id) {
      const target = await findTaskProject(actor, parsed.data.projectId);
      if (!target) return writeFailure(unknownProject());

      if (!canManageTask(actor, { project: target })) {
        return forbidden("You can only move a task to a project you lead.");
      }

      project = target;
    }

    const resolved = await resolveTaskWrite(actor, parsed.data, project, {
      status: task.status,
      completedAt: task.completedAt,
    });
    if (!resolved.ok) return writeFailure(resolved);

    const updated = await db.task.update({
      where: { id: task.id },
      data: resolved.data,
      select: { id: true, title: true, status: true, projectId: true },
    });

    /**
     * Phases.md Phase 6 — status, effort, deadline or assignee can all move the
     * number. The previous assignee is recomputed too when the task changed
     * hands, since their workload just went down.
     */
    const newAssigneeId =
      resolved.data.assigneeId !== undefined
        ? resolved.data.assigneeId
        : task.assigneeId;
    await safeRecalcEmployeeWorkload(actor.companyId, newAssigneeId);
    if (task.assigneeId && task.assigneeId !== newAssigneeId) {
      await safeRecalcEmployeeWorkload(actor.companyId, task.assigneeId);
    }
    // Phases.md Phase 8 — status, deadline or assignee can all move the score.
    await safeRecalcEmployeePerformance(actor.companyId, newAssigneeId);
    if (task.assigneeId && task.assigneeId !== newAssigneeId) {
      await safeRecalcEmployeePerformance(actor.companyId, task.assigneeId);
    }

    return NextResponse.json({
      task: updated,
      /**
       * Handing a task to a project somebody else leads gives away the right to
       * edit it. Better to say so here than to let a Manager find out through a
       * refused save.
       */
      stillManageable: canManageTask(actor, { project }),
    });
  } catch (cause) {
    return serverError(
      {
        route: "PATCH /api/tasks/[id]",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}

/**
 * DELETE /api/tasks/[id] — remove a task.
 *
 * Soft-deleted (Rules.md section 6): a task is what Phase 6's workload and
 * Phase 8's performance scores are computed from, so a row that disappeared
 * outright would quietly rewrite an employee's history. Every read goes through
 * `scopedWhere`, which filters `deletedAt` out, so the task is gone as far as
 * the app is concerned.
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/tasks/[id]">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();
  if (actor.accountType !== "company") return forbidden();

  const { id } = await context.params;

  try {
    const task = await findTask(actor, id);
    if (!task) return apiError("Task not found.", 404, "not_found");

    if (!canManageTask(actor, task)) {
      return forbidden("You can only delete tasks on projects you lead.");
    }

    await db.task.update({
      where: { id: task.id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });

    // Phases.md Phase 6 — a deleted task's hours no longer count.
    await safeRecalcEmployeeWorkload(actor.companyId, task.assigneeId);
    // Phases.md Phase 8 — nor does it count toward completion/on-time rate.
    await safeRecalcEmployeePerformance(actor.companyId, task.assigneeId);

    return NextResponse.json({ deleted: task.id });
  } catch (cause) {
    return serverError(
      {
        route: "DELETE /api/tasks/[id]",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
