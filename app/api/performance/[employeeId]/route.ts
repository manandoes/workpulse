import { NextResponse } from "next/server";
import { apiError, forbidden, serverError, unauthorized } from "@/lib/api";
import { getActor } from "@/lib/auth";
import {
  loadEmployeeSubject,
  loadPerformanceHistory,
} from "@/lib/performance-data";
import { canViewPerformance } from "@/lib/permissions";

/**
 * GET /api/performance/[employeeId] — one employee's score history
 * (Phases.md Phase 8's "performance history timeline").
 *
 * Loaded through the tenant filter first, so an id from another company
 * reads as "not found" rather than leaking that the record exists
 * (Rules.md section 2), then gated by `canViewPerformance` — an employee may
 * read their own, everyone else follows `canEditEmployee`'s scope.
 */
export async function GET(
  request: Request,
  context: RouteContext<"/api/performance/[employeeId]">
) {
  const actor = await getActor();
  if (!actor) return unauthorized();

  const { employeeId } = await context.params;

  try {
    const employee = await loadEmployeeSubject(actor, employeeId);
    if (!employee) return apiError("Employee not found.", 404, "not_found");
    if (!canViewPerformance(actor, employee)) return forbidden();

    const history = await loadPerformanceHistory(actor.companyId, employeeId);
    return NextResponse.json({ history });
  } catch (cause) {
    return serverError(
      {
        route: "GET /api/performance/[employeeId]",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
