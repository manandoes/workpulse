import { db } from "@/lib/db";
import { recalcCompanyAlerts } from "@/lib/alert-data";

/**
 * The periodic alert sweep (Phases.md Phase 9, Architecture.md section 5
 * names this file).
 *
 * `GET /api/dashboard` already regenerates a company's alerts on every visit
 * (see that route's comment on why alerts are read-triggered rather than
 * write-triggered), so this exists as the backstop Architecture.md section 6
 * describes — "refreshed ... on a schedule ... plus on key events" — for a
 * company nobody has opened the dashboard for in a while. Mirrors
 * `jobs/recalculateWorkload.ts`/`recalculatePerformance.ts`: no BullMQ/Redis
 * queue exists yet, so this is called over HTTP by an external scheduler
 * rather than a worker process.
 */
export async function generateAlerts() {
  const companies = await db.company.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  let alerts = 0;
  for (const company of companies) {
    alerts += await recalcCompanyAlerts(company.id);
  }

  return { companies: companies.length, alerts };
}
