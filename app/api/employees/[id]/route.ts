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
import { resolveEmployeeWrite } from "@/lib/employee-data";
import { canEditEmployee, canViewPersonalDetails } from "@/lib/permissions";
import { updateEmployeeSchema } from "@/lib/validations/employees";

/**
 * PATCH /api/employees/[id] — edit an employee profile.
 *
 * Phases.md Phase 3: "add, view, edit and list employees with correct
 * role-based visibility". Owner/Admin/HR may edit anyone in their company; a
 * Manager may edit only their own direct reports (PRD.md section 9).
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/employees/[id]">
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

  const parsed = updateEmployeeSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  try {
    /**
     * Loaded through the tenant filter, so an id from another company reads as
     * "not found" rather than leaking that the record exists at all
     * (Rules.md section 2).
     */
    const employee = await db.employee.findFirst({
      where: scopedWhere(actor, { id }),
      select: { id: true, managerId: true, managerAccountId: true },
    });

    if (!employee) return apiError("Employee not found.", 404, "not_found");

    if (!canEditEmployee(actor, employee)) {
      return forbidden("You can only edit your own direct reports.");
    }

    const resolved = await resolveEmployeeWrite(actor, parsed.data, {
      employeeId: employee.id,
      includePersonal: canViewPersonalDetails(actor, employee),
    });

    if (!resolved.ok) {
      return NextResponse.json(
        {
          error: resolved.message,
          code: resolved.code,
          ...(resolved.field
            ? { fieldErrors: { [resolved.field]: resolved.message } }
            : {}),
        },
        { status: resolved.status }
      );
    }

    const updated = await db.employee.update({
      where: { id: employee.id },
      data: resolved.data,
      select: { id: true, fullName: true },
    });

    return NextResponse.json({ employee: updated });
  } catch (cause) {
    return serverError(
      {
        route: "PATCH /api/employees/[id]",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
