import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { serverError, unauthorized } from "@/lib/api";
import { tokenHashMatches } from "@/lib/invites";
import { recalculatePerformance } from "@/jobs/recalculatePerformance";

/**
 * POST /api/jobs/recalculate-performance — the Phase 8 periodic sweep.
 *
 * Mirrors `app/api/jobs/recalculate-workload/route.ts` exactly: no session,
 * meant for an external scheduler, guarded by `CRON_SECRET` compared in
 * constant time with `tokenHashMatches`.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return serverError(
      { route: "POST /api/jobs/recalculate-performance" },
      new Error("CRON_SECRET is not set")
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!provided || !tokenHashMatches(provided, secret)) {
    return unauthorized("Missing or invalid cron secret.");
  }

  try {
    const result = await recalculatePerformance();
    return NextResponse.json({ recalculated: result });
  } catch (cause) {
    return serverError(
      { route: "POST /api/jobs/recalculate-performance" },
      cause
    );
  }
}
