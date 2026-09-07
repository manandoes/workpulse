import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActor } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  loadAlertsFor,
  loadDashboardMetrics,
  recalcCompanyAlerts,
} from "@/lib/alert-data";
import { formatMoney, formatPercent } from "@/lib/format";
import { performanceBandLabel } from "@/lib/performance";
import { PageHeader } from "@/components/dashboard/page-header";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { WorkloadHeatmap } from "@/components/dashboard/workload-heatmap";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";

export const metadata: Metadata = { title: "Dashboard — AgencyOS" };

/**
 * Role-aware company dashboard (Phases.md Phase 9 — "Admin/Owner sees one
 * dashboard with live counts and a red/yellow/green exceptions panel").
 *
 * Owner/Admin see the full company; a Manager sees the same tiles scoped to
 * their own direct reports and led projects; HR sees people-and-requests
 * tiles only, with no delivery widgets — the scoping lives in
 * `loadDashboardMetrics`/`loadAlertsFor` (`metrics.delivery` is `null` for
 * HR), the same split `isDeliveryRole` already draws for navigation and the
 * workload-settings page.
 */
const INTRO: Record<string, { title: string; description: string }> = {
  Owner: {
    title: "Company dashboard",
    description: "Your agency at a glance.",
  },
  Admin: {
    title: "Company dashboard",
    description: "Your agency at a glance.",
  },
  Manager: {
    title: "Team dashboard",
    description: "Your team's workload and delivery.",
  },
  HR: {
    title: "HR dashboard",
    description: "People and requests.",
  },
};

export default async function DashboardPage() {
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (actor.accountType !== "company") redirect("/my-space");

  const [company] = await Promise.all([
    db.company.findUniqueOrThrow({
      where: { id: actor.companyId },
      select: { currency: true },
    }),
    recalcCompanyAlerts(actor.companyId),
  ]);

  const [metrics, alerts] = await Promise.all([
    loadDashboardMetrics(actor),
    loadAlertsFor(actor),
  ]);

  const intro = INTRO[actor.role] ?? INTRO.Admin;

  return (
    <>
      <PageHeader title={intro.title} description={intro.description} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <MetricTile
          label="Active employees"
          value={String(metrics.activeEmployees)}
        />
        <MetricTile
          label="Pending approvals"
          value={String(metrics.pendingApprovalsCount)}
        />
        <MetricTile
          label="Reimbursements pending"
          value={formatMoney(
            metrics.reimbursementSummary.total,
            company.currency
          )}
          sublabel={`${metrics.reimbursementSummary.count} request${metrics.reimbursementSummary.count === 1 ? "" : "s"}`}
        />
        {metrics.delivery ? (
          <>
            <MetricTile
              label="Active projects"
              value={String(metrics.delivery.activeProjects)}
            />
            <MetricTile
              label="Task completion"
              value={formatPercent(metrics.delivery.taskCompletionPercent)}
            />
            <MetricTile
              label="Overdue tasks"
              value={String(metrics.delivery.overdueTasksCount)}
            />
            <MetricTile
              label="Performance snapshot"
              value={
                metrics.delivery.performanceSnapshot
                  ? metrics.delivery.performanceSnapshot.averageScore.toFixed(1)
                  : "—"
              }
              sublabel={
                metrics.delivery.performanceSnapshot
                  ? performanceBandLabel(
                      metrics.delivery.performanceSnapshot.band
                    )
                  : "Not enough data yet"
              }
            />
          </>
        ) : null}
      </div>

      {metrics.delivery ? (
        <section className="mt-8 flex flex-col gap-3">
          <h2 className="text-h2 text-brand-brown font-semibold">
            Team workload
          </h2>
          <WorkloadHeatmap employees={metrics.delivery.workloadHeatmap} />
        </section>
      ) : null}

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="text-h2 text-brand-brown font-semibold">Exceptions</h2>
        <AlertsPanel alerts={alerts} />
      </section>
    </>
  );
}
