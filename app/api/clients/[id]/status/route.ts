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
import { canManageClients } from "@/lib/permissions";
import { clientStatusSchema } from "@/lib/validations/projects";

/**
 * PATCH /api/clients/[id]/status — archive or restore a client.
 *
 * Kept separate from the profile edit, like the employee status route, so that
 * archiving is always a deliberate act rather than a side effect of saving a
 * form.
 *
 * Rules.md section 6 — the record is never deleted. Its projects, and every
 * task and invoice that will later hang off them, keep pointing at a client
 * that still exists.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/clients/[id]/status">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();

  if (!canManageClients(actor)) {
    return forbidden("Only owners, admins and managers can archive a client.");
  }

  const { id } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("Expected a JSON body.", 400, "invalid_json");
  }

  const parsed = clientStatusSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const client = await db.client.findFirst({
      where: scopedWhere(actor, { id }),
      select: { id: true },
    });

    if (!client) return apiError("Client not found.", 404, "not_found");

    const updated = await db.client.update({
      where: { id: client.id },
      data: { status: parsed.data.status },
      select: { status: true },
    });

    return NextResponse.json({ status: updated.status });
  } catch (cause) {
    return serverError(
      {
        route: "PATCH /api/clients/[id]/status",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
