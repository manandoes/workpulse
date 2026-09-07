"use client";

import { useEffect } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

/**
 * Error boundary must be a Client Component. Sits inside the dashboard shell
 * (sidebar/nav stay interactive — Next only wraps the segment's page below
 * this layout, not the layout itself), so it only needs to fill `<main>`.
 *
 * Next 16 renamed the recovery callback from `reset` to `retry`
 * (node_modules/next/dist/docs/.../file-conventions/error.md).
 */
export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard-error]", error);
  }, [error]);

  return (
    <EmptyState
      title="Something went wrong"
      description="This page hit an unexpected error. You can try again, or head back to the dashboard."
      action={
        <div className="flex justify-center gap-2">
          <Button onClick={() => retry()}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      }
    />
  );
}
