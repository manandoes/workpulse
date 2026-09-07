import Link from "next/link";
import { formatMoney, formatPercent } from "@/lib/format";
import type { ClientFinancials } from "@/lib/financials-data";
import { ClientStatusBadge } from "@/components/projects/status-badge";
import { Card, CardContent } from "@/components/ui/card";

/**
 * The per-client rollup table (Phases.md Phase 11), one row per client with
 * the same shape `TaskList` in `components/tasks/task-views.tsx` uses for its
 * table (`bg-surface-muted` header, thin row rules, no zebra striping —
 * Design.md § 6).
 */
export function FinancialsTable({
  clients,
  currency,
}: {
  clients: ClientFinancials[];
  currency: string;
}) {
  return (
    <Card>
      <CardContent className="py-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-muted">
              <tr className="text-text-secondary text-meta">
                <th className="rounded-l-lg px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">Projects</th>
                <th className="px-3 py-2 font-medium">Team</th>
                <th className="px-3 py-2 font-medium">Tasks</th>
                <th className="px-3 py-2 font-medium">Completion</th>
                <th className="px-3 py-2 font-medium">Value</th>
                <th className="px-3 py-2 font-medium">Cost</th>
                <th className="px-3 py-2 font-medium">Margin</th>
                <th className="rounded-r-lg px-3 py-2 font-medium">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-border border-b">
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/projects/clients/${client.id}`}
                        className="text-brand-brown font-medium underline-offset-4 hover:underline"
                      >
                        {client.name}
                      </Link>
                      <ClientStatusBadge status={client.status} />
                    </div>
                  </td>
                  <td className="text-text-secondary px-3 py-3">
                    {client.rollup.projectCount}
                  </td>
                  <td className="text-text-secondary px-3 py-3">
                    {client.rollup.teamSize}
                  </td>
                  <td className="text-text-secondary px-3 py-3">
                    {client.rollup.taskCount}
                  </td>
                  <td className="text-text-secondary px-3 py-3">
                    {formatPercent(client.rollup.completionPercent)}
                  </td>
                  <td className="text-text-secondary px-3 py-3">
                    {formatMoney(client.rollup.value, currency)}
                  </td>
                  <td className="text-text-secondary px-3 py-3">
                    {formatMoney(client.rollup.estimatedCost, currency)}
                  </td>
                  <td className="text-text-secondary px-3 py-3">
                    {formatMoney(client.rollup.margin, currency)}
                  </td>
                  <td className="text-text-secondary px-3 py-3">
                    {formatPercent(client.rollup.marginPercent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
