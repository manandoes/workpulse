import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Building blocks for `loading.tsx` files across the dashboard (Phase 12 —
 * "loading states across all pages"). Shaped roughly like the real content
 * (a header, a filter bar, a table) rather than a single generic spinner, per
 * Next's guidance to prerender "a small but meaningful part of future
 * screens."
 */

export function SkeletonHeader() {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

/** A directory/table-style list: header, a filter bar, N row placeholders. */
export function SkeletonList({ rows = 6 }: { rows?: number }) {
  return (
    <>
      <SkeletonHeader />
      <Skeleton className="mb-6 h-9 w-full max-w-md" />
      <Card>
        <CardContent className="flex flex-col gap-3 py-2">
          {Array.from({ length: rows }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </>
  );
}

/** A single-record detail page: header, then a couple of field blocks. */
export function SkeletonDetail() {
  return (
    <>
      <SkeletonHeader />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <CardContent className="flex flex-col gap-3 py-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

/** Metric tiles + a wider panel, for the aggregate dashboard. */
export function SkeletonDashboard() {
  return (
    <>
      <SkeletonHeader />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </>
  );
}
