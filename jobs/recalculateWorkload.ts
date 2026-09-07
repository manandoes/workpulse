import { recalcAllCompanies } from "@/lib/workload-data";

/**
 * The periodic workload sweep (Phases.md Phase 6, Architecture.md section 5
 * names this file).
 *
 * Architecture.md's plan runs this from a BullMQ worker on a Redis queue. No
 * such infra exists yet (Phase 0 only stood up Postgres) and no hosting
 * platform is chosen (Memory.md's open Phase 0 blocker), so for now this
 * function is called by `app/api/jobs/recalculate-workload/route.ts` instead
 * of a worker process — an external scheduler (Vercel Cron, GitHub Actions, a
 * plain server cron job hitting the endpoint) triggers it. Task writes already
 * recompute the employees they touch immediately
 * (see `lib/workload-data.ts`), so this sweep is a safety net — it catches a
 * task quietly crossing an urgency threshold (for example becoming overdue at
 * midnight) with nobody having edited it.
 */
export async function recalculateWorkload() {
  return recalcAllCompanies();
}
