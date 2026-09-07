import { cn } from "cn";
import { formatPercent } from "@/lib/format";
import { workloadBand, workloadBandLabel } from "@/lib/workload";
import { Card, CardContent } from "@/components/ui/card";

const FILL: Record<ReturnType<typeof workloadBand>, string> = {
  success: "bg-success/15 border-success",
  warning: "bg-warning/15 border-warning",
  danger: "bg-danger/15 border-danger",
};

const TEXT: Record<ReturnType<typeof workloadBand>, string> = {
  success: "text-success-text",
  warning: "text-warning-text",
  danger: "text-danger-text",
};

/**
 * The team workload heatmap (PRD.md section 6.4's example: "Rahul 92%,
 * Priya 61%, Aman 38%"), one colored cell per employee, reusing Phase 6's
 * cached `workloadPercent` — this reads what already exists, it does not
 * recompute anything.
 */
export function WorkloadHeatmap({
  employees,
}: {
  employees: { id: string; fullName: string; workloadPercent: number | null }[];
}) {
  if (employees.length === 0) {
    return <p className="text-text-secondary">No employees yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {employees.map((employee) => {
        const band =
          employee.workloadPercent === null
            ? null
            : workloadBand(employee.workloadPercent);

        return (
          <Card
            key={employee.id}
            className={cn(
              "border",
              band ? FILL[band] : "border-border bg-surface-muted"
            )}
          >
            <CardContent className="flex flex-col gap-1 py-2">
              <p className="text-brand-brown truncate font-medium">
                {employee.fullName}
              </p>
              {band ? (
                <>
                  <p className={cn("text-h3 font-semibold", TEXT[band])}>
                    {formatPercent(employee.workloadPercent)}
                  </p>
                  <p className="text-text-secondary text-meta">
                    {workloadBandLabel(band)}
                  </p>
                </>
              ) : (
                <p className="text-text-secondary text-meta">
                  Not yet calculated
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
