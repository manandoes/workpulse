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
  createFeedback,
  loadEmployeeSubject,
  loadFeedback,
  safeRecalcEmployeePerformance,
} from "@/lib/performance-data";
import { canEditEmployee, canViewPerformance } from "@/lib/permissions";
import { createFeedbackSchema } from "@/lib/validations/performance";

/**
 * GET/POST /api/performance/[employeeId]/feedback — the manager feedback log
 * (Phases.md Phase 8).
 *
 * Visible to the employee immediately on submission (confirmed with the
 * user) — there is no draft/private state, so the GET side uses the same
 * `canViewPerformance` gate as everything else on this page.
 */
export async function GET(
  request: Request,
  context: RouteContext<"/api/performance/[employeeId]/feedback">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();

  const { employeeId } = await context.params;

  try {
    const employee = await loadEmployeeSubject(actor, employeeId);
    if (!employee) return apiError("Employee not found.", 404, "not_found");
    if (!canViewPerformance(actor, employee)) return forbidden();

    const feedback = await loadFeedback(actor.companyId, employeeId);
    return NextResponse.json({ feedback });
  } catch (cause) {
    return serverError(
      {
        route: "GET /api/performance/[employeeId]/feedback",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/performance/[employeeId]/feedback">
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

  const parsed = createFeedbackSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const employee = await loadEmployeeSubject(actor, employeeId);
    if (!employee) return apiError("Employee not found.", 404, "not_found");
    if (!canEditEmployee(actor, employee)) {
      return forbidden(
        "You can only give feedback to your own direct reports."
      );
    }

    const feedback = await createFeedback(
      actor.companyId,
      employeeId,
      actor.id,
      parsed.data
    );

    // Best-effort: a failed recompute must never fail the feedback being saved.
    await safeRecalcEmployeePerformance(actor.companyId, employeeId);

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (cause) {
    return serverError(
      {
        route: "POST /api/performance/[employeeId]/feedback",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
