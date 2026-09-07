import { cn } from "cn";
import { formatPercent } from "@/lib/format";
import { workloadBand, workloadBandLabel } from "@/lib/workload";

/**
 * The workload visual indicator (Phases.md Phase 6 — "workload display per
 * employee (%, visual indicator)").
 *
 * Uses Design.md's Workload Indicator Scale exactly: success/warning/danger by
 * range, never brand yellow/brown. The band's word is always shown beside the
 * color (Design.md section 10 — color never carries meaning alone), the same
 * pairing `OverdueBadge` and `TaskStatusBadge` use for status.
 */
export function WorkloadBar({
  percent,
  className,
}: {
  /** `null` means never computed yet — distinct from a real 0%. */
  percent: number | null;
  className?: string;
}) {
  if (percent === null) {
    return (
      <p className={cn("text-text-secondary text-meta", className)}>
        Not yet calculated
      </p>
    );
  }

  const band = workloadBand(percent);
  const fill: Record<typeof band, string> = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  };
  const text: Record<typeof band, string> = {
    success: "text-success-text",
    warning: "text-warning-text",
    danger: "text-danger-text",
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("font-medium", text[band])}>
          {formatPercent(percent)}
        </span>
        <span className="text-text-secondary text-meta">
          {workloadBandLabel(band)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Workload: ${formatPercent(percent)}, ${workloadBandLabel(band)}`}
        className="bg-surface-muted h-2 w-full overflow-hidden rounded-full"
      >
        <div
          className={cn("h-full rounded-full", fill[band])}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
