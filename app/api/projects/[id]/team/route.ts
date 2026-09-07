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
import { resolveTeamMember } from "@/lib/project-data";
import { canManageProject } from "@/lib/permissions";
import { projectMemberSchema } from "@/lib/validations/projects";
import type { SessionActor } from "@/lib/permissions";

/**
 * The project team (Phases.md Phase 4 — "assign employees to a project").
 *
 * `ProjectMember` is always reached through a project that has already been
 * loaded through the tenant filter, which is what proves the tenant; the
 * employee on the other side of the link is proven separately by
 * `resolveTeamMember`.
 */

type Loaded =
  | { ok: true; project: { id: string; leadAccountId: string | null } }
  | { ok: false; response: NextResponse };

async function loadManageableProject(
  actor: SessionActor,
  id: string
): Promise<Loaded> {
  const project = await db.project.findFirst({
    where: scopedWhere(actor, { id }),
    select: { id: true, leadAccountId: true },
  });

  if (!project) {
    return {
      ok: false,
      response: apiError("Project not found.", 404, "not_found"),
    };
  }

  if (!canManageProject(actor, project)) {
    return {
      ok: false,
      response: forbidden("You can only change the team on projects you lead."),
    };
  }

  return { ok: true, project };
}

/** Reads and validates the `{ employeeId }` body both handlers take. */
async function readMemberBody(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return {
      ok: false as const,
      response: apiError("Expected a JSON body.", 400, "invalid_json"),
    };
  }

  const parsed = projectMemberSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false as const, response: validationError(parsed.error) };
  }

  return { ok: true as const, employeeId: parsed.data.employeeId };
}

/** POST /api/projects/[id]/team — add an employee to the team. */
export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/projects/[id]/team">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();
  if (actor.accountType !== "company") return forbidden();

  const { id } = await context.params;

  const body = await readMemberBody(request);
  if (!body.ok) return body.response;

  try {
    const loaded = await loadManageableProject(actor, id);
    if (!loaded.ok) return loaded.response;

    const resolved = await resolveTeamMember(
      actor,
      loaded.project.id,
      body.employeeId
    );
    if (!resolved.ok) return writeFailure(resolved);

    const member = await db.projectMember.create({
      data: {
        companyId: actor.companyId,
        projectId: loaded.project.id,
        employeeId: resolved.employeeId,
      },
      select: {
        id: true,
        employee: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (cause) {
    return serverError(
      {
        route: "POST /api/projects/[id]/team",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}

/**
 * DELETE /api/projects/[id]/team — take an employee off the team.
 *
 * The membership row is genuinely deleted rather than soft-deleted: it records
 * no history of its own, and keeping a tombstone would only block re-adding the
 * same person. The employee record itself is untouched.
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext<"/api/projects/[id]/team">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();
  if (actor.accountType !== "company") return forbidden();

  const { id } = await context.params;

  const body = await readMemberBody(request);
  if (!body.ok) return body.response;

  try {
    const loaded = await loadManageableProject(actor, id);
    if (!loaded.ok) return loaded.response;

    const removed = await db.projectMember.deleteMany({
      where: { projectId: loaded.project.id, employeeId: body.employeeId },
    });

    if (removed.count === 0) {
      return apiError("They are not on this team.", 404, "not_found");
    }

    return NextResponse.json({ removed: removed.count });
  } catch (cause) {
    return serverError(
      {
        route: "DELETE /api/projects/[id]/team",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
