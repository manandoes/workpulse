import { recalcAllCompaniesPerformance } from "@/lib/performance-data";

/**
 * The periodic performance sweep (Phases.md Phase 8, Architecture.md section 5
 * names this file).
 *
 * Same reasoning as `jobs/recalculateWorkload.ts`: no BullMQ/Redis queue
 * exists and no hosting platform is chosen yet, so this is called by
 * `app/api/jobs/recalculate-performance/route.ts` for an external scheduler
 * to hit, rather than a worker process. Task/goal/feedback writes already
 * recompute the employee they touch immediately (see
 * `lib/performance-data.ts`), so this sweep is a safety net.
 */
export async function recalculatePerformance() {
  return recalcAllCompaniesPerformance();
}
