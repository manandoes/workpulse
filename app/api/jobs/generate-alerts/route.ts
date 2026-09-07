import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { serverError, unauthorized } from "@/lib/api";
import { tokenHashMatches } from "@/lib/invites";
import { generateAlerts } from "@/jobs/generateAlerts";

/**
 * POST /api/jobs/generate-alerts — the Phase 9 periodic sweep.
 *
 * Mirrors `app/api/jobs/recalculate-workload/route.ts` and
 * `recalculate-performance/route.ts` exactly: no session, meant for an
 * external scheduler, guarded by `CRON_SECRET` compared in constant time
 * with `tokenHashMatches`.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return serverError(
      { route: "POST /api/jobs/generate-alerts" },
      new Error("CRON_SECRET is not set")
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!provided || !tokenHashMatches(provided, secret)) {
    return unauthorized("Missing or invalid cron secret.");
  }

  try {
    const result = await generateAlerts();
    return NextResponse.json({ generated: result });
  } catch (cause) {
    return serverError({ route: "POST /api/jobs/generate-alerts" }, cause);
  }
}
