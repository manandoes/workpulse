import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { serverError, unauthorized } from "@/lib/api";
import { tokenHashMatches } from "@/lib/invites";
import { recalculateWorkload } from "@/jobs/recalculateWorkload";

/**
 * POST /api/jobs/recalculate-workload — the Phase 6 periodic sweep.
 *
 * No session: this is meant to be called by an external scheduler (Vercel
 * Cron, GitHub Actions, a plain server cron job), not a signed-in user, and it
 * crosses every tenant on purpose. `CRON_SECRET` is the only thing standing
 * between this and anyone on the internet, so it is required and compared in
 * constant time with `tokenHashMatches` — the same comparator invite tokens
 * use, for the same reason.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return serverError(
      { route: "POST /api/jobs/recalculate-workload" },
      new Error("CRON_SECRET is not set")
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!provided || !tokenHashMatches(provided, secret)) {
    return unauthorized("Missing or invalid cron secret.");
  }

  try {
    const result = await recalculateWorkload();
    return NextResponse.json({ recalculated: result });
  } catch (cause) {
    return serverError({ route: "POST /api/jobs/recalculate-workload" }, cause);
  }
}
