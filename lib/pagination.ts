import { z } from "zod";

/**
 * Shared pagination (Phases.md Phase 12 — "performance/query optimization
 * for larger datasets"). Pure logic, free of Prisma/Next imports, mirroring
 * every other `lib/*.ts` pure module so it can be unit-tested directly.
 *
 * Every list page merges `paginationSchema`'s shape into its own filters
 * schema, computes `paginationMeta(total, page)`, and passes `skip`/`take`
 * straight to Prisma alongside a `db.<model>.count()` using the same
 * `where`.
 */

export const PAGE_SIZE = 25;

/** Malformed or missing `page` values fall back to page 1, same as every
 * other filter in this codebase (Rules.md — filters come from a URL a user
 * can freely edit, so they degrade rather than error). */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1).optional().default(1),
});

export type PaginationMeta = {
  page: number;
  pageCount: number;
  total: number;
  skip: number;
  take: number;
};

/**
 * `page` is clamped into `[1, pageCount]` — a stale link to page 9 of a list
 * that has since shrunk to 3 pages lands on page 3 rather than an empty
 * result the user has no way back from.
 */
export function paginationMeta(
  total: number,
  requestedPage: number
): PaginationMeta {
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), pageCount);

  return {
    page,
    pageCount,
    total,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  };
}
