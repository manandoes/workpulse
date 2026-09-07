import { Star } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "cn";

export type FeedbackSummary = {
  id: string;
  rating: number;
  body: string;
  createdAt: Date;
  givenBy: { fullName: string } | null;
};

/**
 * The manager feedback log (Phases.md Phase 8). Shared by the manager's
 * performance detail page and the employee's own My Growth — feedback is
 * visible to the employee as soon as it is given, so this list needs no
 * "may view" gate beyond the page already having one.
 */
export function FeedbackList({ feedback }: { feedback: FeedbackSummary[] }) {
  if (feedback.length === 0) {
    return <p className="text-text-secondary">No feedback yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-(--color-border)">
      {feedback.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-2 py-3">
          <div
            className="flex items-center gap-1"
            aria-label={`${entry.rating} out of 5`}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                aria-hidden
                className={cn(
                  "size-4",
                  star <= entry.rating
                    ? "fill-brand-yellow text-brand-yellow"
                    : "text-brand-brown-light"
                )}
              />
            ))}
          </div>
          <p>{entry.body}</p>
          <p className="text-text-secondary text-meta">
            {entry.givenBy?.fullName ?? "A former team member"} ·{" "}
            {formatDate(entry.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
