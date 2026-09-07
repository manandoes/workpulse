"use client";

import { useEffect } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

/** Sits inside the marketing shell (header/footer stay, per Next's error.js
 * component hierarchy — it wraps the page below this layout, not the layout
 * itself). Next 16 renamed the recovery callback `reset` to `retry`. */
export default function MarketingError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[marketing-error]", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <EmptyState
        title="Something went wrong"
        description="This page hit an unexpected error. You can try again, or head back home."
        action={
          <div className="flex justify-center gap-2">
            <Button onClick={() => retry()}>Try again</Button>
            <Button asChild variant="outline">
              <Link href="/">Back home</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
