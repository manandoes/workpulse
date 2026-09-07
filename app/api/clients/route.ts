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
import { clientFilter } from "@/lib/projects";
import { resolveClientWrite } from "@/lib/project-data";
import { canManageClients, canViewProjects } from "@/lib/permissions";
import {
  clientFiltersSchema,
  createClientSchema,
} from "@/lib/validations/projects";

/**
 * Clients (Phases.md Phase 4).
 *
 * Architecture.md section 5 lists `api/projects/`; clients get their own
 * collection alongside it for the same reason `api/company-accounts/` exists —
 * they are a resource in their own right, not a sub-path of a project.
 */

/** GET /api/clients — the client list for the caller's company. */
export async function GET(request: NextRequest) {
  const actor = await getActor();
  if (!actor) return unauthorized();
  if (!canViewProjects(actor)) return forbidden();

  const filters = clientFiltersSchema.parse(
    Object.fromEntries(request.nextUrl.searchParams)
  );

  try {
    const clients = await db.client.findMany({
      // Tenant scoping (Rules.md section 2) — applied last, so a filter can
      // never widen the query beyond the caller's own company.
      where: scopedWhere(actor, clientFilter(filters)),
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        status: true,
        createdAt: true,
        _count: { select: { projects: { where: { deletedAt: null } } } },
      },
    });

    return NextResponse.json({ clients });
  } catch (cause) {
    return serverError(
      {
        route: "GET /api/clients",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}

/** POST /api/clients — add a client (Owner, Admin or Manager). */
export async function POST(request: NextRequest) {
  const actor = await getActor();
  if (!actor) return unauthorized();

  // Role check is server-side and independent of what the UI showed
  // (Rules.md section 3).
  if (!canManageClients(actor)) {
    return forbidden("Only owners, admins and managers can add clients.");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("Expected a JSON body.", 400, "invalid_json");
  }

  const parsed = createClientSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const resolved = await resolveClientWrite(actor, parsed.data);
    if (!resolved.ok) return writeFailure(resolved);

    const client = await db.client.create({
      data: { ...resolved.data, companyId: actor.companyId },
      select: { id: true, name: true, status: true },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (cause) {
    return serverError(
      {
        route: "POST /api/clients",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
