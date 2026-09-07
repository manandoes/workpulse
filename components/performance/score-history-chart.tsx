"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate } from "@/lib/format";

export type ScoreHistoryPoint = { score: number; computedAt: Date | string };

/**
 * The score history timeline (Architecture.md's ERD:
 * `Employee 1---* PerformanceRecord`, PRD.md section 6.5).
 *
 * A single series, so it uses brand-yellow as the one accent color rather
 * than the status palette (Design.md § 7 — "any neutral data series ... uses
 * brand-yellow as the single accent color"); the score's band/meaning is
 * shown separately by `PerformanceScoreBadge`, not by this line's color.
 */
export function ScoreHistoryChart({
  history,
}: {
  /** Oldest first, so the line reads left-to-right through time. */
  history: ScoreHistoryPoint[];
}) {
  if (history.length < 2) {
    return (
      <p className="text-text-secondary">
        Not enough history yet to chart a trend.
      </p>
    );
  }

  const data = history.map((point) => ({
    date: formatDate(point.computedAt),
    score: point.score,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--color-brand-yellow)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
