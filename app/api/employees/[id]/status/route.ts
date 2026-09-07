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
import { scopedWhere } from "@/lib/tenant";
import { db } from "@/lib/db";
import { nextStatusFor } from "@/lib/employees";
import { canManageEmployees } from "@/lib/permissions";
import { employeeStatusSchema } from "@/lib/validations/employees";

/**
 * PATCH /api/employees/[id]/status — suspend or reactivate an employee.
 *
 * Kept separate from the profile edit so that suspending someone is always a
 * deliberate act, never a side effect of saving a form.
 *
 * Rules.md section 6 — the record is never deleted. Suspension revokes the
 * login while leaving the person's history intact for the tasks, requests and
 * performance records that later phases attach to them.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/employees/[id]/status">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();

  if (!canManageEmployees(actor)) {
    return forbidden(
      "Only owners, admins and HR can change an employee's status."
    );
  }

  const { id } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("Expected a JSON body.", 400, "invalid_json");
  }

  const parsed = employeeStatusSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const employee = await db.employee.findFirst({
      where: scopedWhere(actor, { id }),
      select: { id: true, passwordHash: true },
    });

    if (!employee) return apiError("Employee not found.", 404, "not_found");

    /**
     * Someone who never accepted their invite has no password, so reactivating
     * them cannot make them Active — they go back to Invited and the admin is
     * told to resend the link.
     */
    const status = nextStatusFor(
      parsed.data.status,
      employee.passwordHash !== null
    );

    await db.employee.update({
      where: { id: employee.id },
      data: { status },
    });

    return NextResponse.json({ status });
  } catch (cause) {
    return serverError(
      {
        route: "PATCH /api/employees/[id]/status",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
