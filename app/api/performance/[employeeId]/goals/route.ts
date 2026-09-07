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
import {
  createGoal,
  loadEmployeeSubject,
  loadGoals,
  safeRecalcEmployeePerformance,
} from "@/lib/performance-data";
import { canEditEmployee, canViewPerformance } from "@/lib/permissions";
import { createGoalSchema } from "@/lib/validations/performance";

/**
 * GET/POST /api/performance/[employeeId]/goals — an employee's goals
 * (Phases.md Phase 8's "goal creation/tracking per employee").
 *
 * Goals are manager-owned (confirmed with the user): Owner/Admin/HR or the
 * employee's own manager create them (`canEditEmployee`'s existing scope),
 * an employee only ever reads their own.
 */
export async function GET(
  request: Request,
  context: RouteContext<"/api/performance/[employeeId]/goals">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();

  const { employeeId } = await context.params;

  try {
    const employee = await loadEmployeeSubject(actor, employeeId);
    if (!employee) return apiError("Employee not found.", 404, "not_found");
    if (!canViewPerformance(actor, employee)) return forbidden();

    const goals = await loadGoals(actor.companyId, employeeId);
    return NextResponse.json({ goals });
  } catch (cause) {
    return serverError(
      {
        route: "GET /api/performance/[employeeId]/goals",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/performance/[employeeId]/goals">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();
  if (actor.accountType !== "company") return forbidden();

  const { employeeId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("Expected a JSON body.", 400, "invalid_json");
  }

  const parsed = createGoalSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const employee = await loadEmployeeSubject(actor, employeeId);
    if (!employee) return apiError("Employee not found.", 404, "not_found");
    if (!canEditEmployee(actor, employee)) {
      return forbidden("You can only set goals for your own direct reports.");
    }

    const goal = await createGoal(
      actor.companyId,
      employeeId,
      actor.id,
      parsed.data
    );

    // Best-effort: a failed recompute must never fail the goal being saved.
    await safeRecalcEmployeePerformance(actor.companyId, employeeId);

    return NextResponse.json({ goal }, { status: 201 });
  } catch (cause) {
    return serverError(
      {
        route: "POST /api/performance/[employeeId]/goals",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
