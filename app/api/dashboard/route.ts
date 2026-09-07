import { NextResponse } from "next/server";
import { forbidden, serverError, unauthorized } from "@/lib/api";
import { getActor } from "@/lib/auth";
import {
  loadAlertsFor,
  loadDashboardMetrics,
  recalcCompanyAlerts,
} from "@/lib/alert-data";

/**
 * GET /api/dashboard — the aggregate dashboard tiles and the exceptions
 * panel (Phases.md Phase 9).
 *
 * Unlike Phase 6/8's per-write recompute, an alert's condition can become
 * true purely from elapsed time (a task going overdue, a request aging) —
 * there is no single write to hang a recompute off. So the natural trigger
 * is "someone is looking at the dashboard": alerts are regenerated here,
 * synchronously, before being read, with `/api/jobs/generate-alerts` as a
 * scheduled backstop for staleness between visits.
 */
export async function GET() {
  const actor = await getActor();
  if (!actor) return unauthorized();
  if (actor.accountType !== "company") return forbidden();

  try {
    await recalcCompanyAlerts(actor.companyId);

    const [metrics, alerts] = await Promise.all([
      loadDashboardMetrics(actor),
      loadAlertsFor(actor),
    ]);

    return NextResponse.json({ metrics, alerts });
  } catch (cause) {
    return serverError(
      {
        route: "GET /api/dashboard",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
