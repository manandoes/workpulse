import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/lib/pagination";
import { PAGE_SIZE } from "@/lib/pagination";
import { Button } from "@/components/ui/button";

/**
 * Prev/Next pagination for a list page (Phases.md Phase 12).
 *
 * A plain server-renderable component — no `"use client"` — that builds
 * hrefs by hand from the page's raw `searchParams`, the same way
 * `tasks/page.tsx`'s `ViewToggle` already does, rather than pulling in
 * `ListFilters`'s client-side router for something that needs no
 * interactivity. `page` is deliberately left out of every list page's
 * `ListFilters` `names`/`preserve` list, so changing a filter already drops
 * back to page 1 for free — this component only ever adds/replaces `page`.
 */
export function Pagination({
  basePath,
  query,
  meta,
}: {
  basePath: string;
  query: Record<string, string | string[] | undefined>;
  meta: PaginationMeta;
}) {
  if (meta.total === 0 || meta.pageCount <= 1) return null;

  function href(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (key !== "page" && typeof value === "string" && value) {
        params.set(key, value);
      }
    }
    if (page > 1) params.set("page", String(page));
    const q = params.toString();
    return q ? `${basePath}?${q}` : basePath;
  }

  const from = meta.skip + 1;
  const to = Math.min(meta.skip + PAGE_SIZE, meta.total);

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-text-secondary text-meta">
        Showing {from}–{to} of {meta.total}
      </p>
      <div className="flex gap-2">
        {meta.page <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft aria-hidden />
            Previous
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={href(meta.page - 1)}>
              <ChevronLeft aria-hidden />
              Previous
            </Link>
          </Button>
        )}
        {meta.page >= meta.pageCount ? (
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight aria-hidden />
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href={href(meta.page + 1)}>
              Next
              <ChevronRight aria-hidden />
            </Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
