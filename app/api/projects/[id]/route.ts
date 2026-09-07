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
import { scopedWhere } from "@/lib/tenant";
import { resolveProjectWrite } from "@/lib/project-data";
import { canManageProject } from "@/lib/permissions";
import { updateProjectSchema } from "@/lib/validations/projects";

/**
 * PATCH /api/projects/[id] — edit a project, including its status and its
 * financials.
 *
 * Owner and Admin may edit any project in their company; a Manager may edit the
 * projects they lead (PRD.md section 9 — "own team's projects").
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/projects/[id]">
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

  const parsed = updateProjectSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  try {
    /**
     * Loaded through the tenant filter, so an id from another company reads as
     * "not found" rather than leaking that the record exists at all
     * (Rules.md section 2).
     */
    const project = await db.project.findFirst({
      where: scopedWhere(actor, { id }),
      select: { id: true, leadAccountId: true },
    });

    if (!project) return apiError("Project not found.", 404, "not_found");

    if (!canManageProject(actor, project)) {
      return forbidden("You can only edit projects you lead.");
    }

    const resolved = await resolveProjectWrite(actor, parsed.data, {
      projectId: project.id,
    });
    if (!resolved.ok) return writeFailure(resolved);

    const updated = await db.project.update({
      where: { id: project.id },
      data: resolved.data,
      select: { id: true, name: true, status: true, leadAccountId: true },
    });

    return NextResponse.json({
      project: updated,
      /**
       * A Manager who hands the lead to someone else has just given away their
       * own right to edit this project, so the client is told rather than
       * finding out through a 403 on the next save.
       */
      stillManageable: canManageProject(actor, updated),
    });
  } catch (cause) {
    return serverError(
      {
        route: "PATCH /api/projects/[id]",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
