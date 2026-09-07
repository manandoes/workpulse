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
import { projectFilter } from "@/lib/projects";
import { resolveProjectWrite } from "@/lib/project-data";
import { canCreateProjects, canViewProjects } from "@/lib/permissions";
import {
  createProjectSchema,
  projectFiltersSchema,
} from "@/lib/validations/projects";

/**
 * GET /api/projects — the project list for the caller's company.
 *
 * Supports the same search and filters as the projects page, so the two can
 * never disagree about what a role is allowed to see.
 */
export async function GET(request: NextRequest) {
  const actor = await getActor();
  if (!actor) return unauthorized();
  if (!canViewProjects(actor)) return forbidden();

  const filters = projectFiltersSchema.parse(
    Object.fromEntries(request.nextUrl.searchParams)
  );

  try {
    const projects = await db.project.findMany({
      // Tenant scoping (Rules.md section 2) — applied last, so a filter can
      // never widen the query beyond the caller's own company.
      where: scopedWhere(actor, projectFilter(filters)),
      orderBy: [{ status: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        startDate: true,
        dueDate: true,
        value: true,
        estimatedCost: true,
        client: { select: { id: true, name: true } },
        leadAccount: { select: { id: true, fullName: true } },
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json({ projects });
  } catch (cause) {
    return serverError(
      {
        route: "GET /api/projects",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}

/** POST /api/projects — start a project under a client (Phases.md Phase 4). */
export async function POST(request: NextRequest) {
  const actor = await getActor();
  if (!actor) return unauthorized();

  // Role check is server-side and independent of what the UI showed
  // (Rules.md section 3).
  if (!canCreateProjects(actor)) {
    return forbidden("Only owners, admins and managers can create projects.");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("Expected a JSON body.", 400, "invalid_json");
  }

  const parsed = createProjectSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const resolved = await resolveProjectWrite(actor, parsed.data);
    if (!resolved.ok) return writeFailure(resolved);

    const project = await db.project.create({
      data: {
        ...resolved.data,
        companyId: actor.companyId,
        /**
         * A project starts with somebody accountable, and unless another lead
         * was named that is whoever created it. Without this a Manager could
         * create a project and immediately lose the right to edit it, because
         * `canManageProject` grants a Manager only the projects they lead.
         */
        leadAccountId: resolved.data.leadAccountId ?? actor.id,
      },
      select: { id: true, name: true, status: true },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (cause) {
    return serverError(
      {
        route: "POST /api/projects",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
