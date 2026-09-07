import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActor } from "@/lib/auth";
import {
  loadFeedback,
  loadGoals,
  loadPerformanceHistory,
} from "@/lib/performance-data";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PerformanceScoreBadge } from "@/components/performance/score-badge";
import { ScoreHistoryChart } from "@/components/performance/score-history-chart";
import { GoalList } from "@/components/performance/goal-views";
import { FeedbackList } from "@/components/performance/feedback-views";

export const metadata: Metadata = { title: "My Growth — AgencyOS" };

/**
 * An employee's own performance page (PRD.md section 6.9 — "My Growth":
 * goals, performance, feedback, achievements).
 *
 * Self-view only, the same pattern as `/my-space/requests` — goals and
 * feedback are manager-owned, so this is read-only with no forms.
 */
export default async function MyGrowthPage() {
  const actor = await getActor();
  if (!actor) redirect("/login");
  if (actor.accountType !== "employee") redirect("/dashboard");

  const [history, goals, feedback] = await Promise.all([
    loadPerformanceHistory(actor.companyId, actor.id),
    loadGoals(actor.companyId, actor.id),
    loadFeedback(actor.companyId, actor.id),
  ]);

  const latestScore = history[0]?.score ?? null;
  const chartHistory = [...history].reverse().map((point) => ({
    score: Number(point.score),
    computedAt: point.computedAt,
  }));

  return (
    <>
      <PageHeader
        title="My Growth"
        description="Your performance score, goals and feedback."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-h3 text-brand-brown font-semibold">Score</h2>
            <PerformanceScoreBadge
              score={latestScore === null ? null : Number(latestScore)}
            />
          </div>
          <ScoreHistoryChart history={chartHistory} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 py-2">
          <h2 className="text-h3 text-brand-brown font-semibold">Goals</h2>
          <GoalList employeeId={actor.id} goals={goals} mayDecide={false} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 py-2">
          <h2 className="text-h3 text-brand-brown font-semibold">Feedback</h2>
          <FeedbackList feedback={feedback} />
        </CardContent>
      </Card>
    </>
  );
}
