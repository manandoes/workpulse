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
import { resolveClientWrite } from "@/lib/project-data";
import { canManageClients } from "@/lib/permissions";
import { updateClientSchema } from "@/lib/validations/projects";

/**
 * PATCH /api/clients/[id] — edit a client, or archive and restore one.
 *
 * Rules.md section 6: a client that projects reference is never deleted.
 * Archiving keeps the record and its history, and takes the client out of the
 * pickers for new work.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/clients/[id]">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();

  if (!canManageClients(actor)) {
    return forbidden("Only owners, admins and managers can edit clients.");
  }

  const { id } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("Expected a JSON body.", 400, "invalid_json");
  }

  const parsed = updateClientSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  try {
    /**
     * Loaded through the tenant filter, so an id from another company reads as
     * "not found" rather than leaking that the record exists at all
     * (Rules.md section 2).
     */
    const client = await db.client.findFirst({
      where: scopedWhere(actor, { id }),
      select: { id: true },
    });

    if (!client) return apiError("Client not found.", 404, "not_found");

    const resolved = await resolveClientWrite(actor, parsed.data, {
      clientId: client.id,
    });
    if (!resolved.ok) return writeFailure(resolved);

    const updated = await db.client.update({
      where: { id: client.id },
      data: resolved.data,
      select: { id: true, name: true, status: true },
    });

    return NextResponse.json({ client: updated });
  } catch (cause) {
    return serverError(
      {
        route: "PATCH /api/clients/[id]",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
