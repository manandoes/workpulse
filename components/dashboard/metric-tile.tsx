import { Card, CardContent } from "@/components/ui/card";

/**
 * One aggregate stat tile (Phases.md Phase 9 — "real-time counts"), reused
 * for every count/percentage on the dashboard.
 */
export function MetricTile({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-2">
        <p className="text-text-secondary text-meta">{label}</p>
        <p className="text-h1 text-brand-brown font-semibold">{value}</p>
        {sublabel ? (
          <p className="text-text-secondary text-meta">{sublabel}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
