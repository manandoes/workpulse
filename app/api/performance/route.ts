import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { forbidden, serverError, unauthorized } from "@/lib/api";
import { getActor } from "@/lib/auth";
import { loadPerformanceQueue } from "@/lib/performance-data";
import { paginationSchema } from "@/lib/pagination";
import { performanceFiltersSchema } from "@/lib/validations/performance";

/**
 * GET /api/performance — the performance list (Phases.md Phase 8).
 *
 * Company accounts only. Scoping to a Manager's own direct reports happens
 * inside `loadPerformanceQueue`, the same split `GET /api/requests` draws for
 * the approval queue.
 */
export async function GET(request: NextRequest) {
  const actor = await getActor();
  if (!actor) return unauthorized();
  if (actor.accountType !== "company") return forbidden();

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const filters = performanceFiltersSchema.parse(params);
    const { page: requestedPage } = paginationSchema.parse(params);
    const { employees, total, page, pageCount } = await loadPerformanceQueue(
      actor,
      filters,
      requestedPage
    );
    return NextResponse.json({ employees, total, page, pageCount });
  } catch (cause) {
    return serverError(
      {
        route: "GET /api/performance",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
