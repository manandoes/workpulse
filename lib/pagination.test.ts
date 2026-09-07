import { describe, expect, it } from "vitest";
import { PAGE_SIZE, paginationMeta, paginationSchema } from "@/lib/pagination";

describe("paginationSchema", () => {
  it("defaults to page 1 when absent", () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1 });
  });

  it("coerces a numeric string from the URL", () => {
    expect(paginationSchema.parse({ page: "3" })).toEqual({ page: 3 });
  });

  it("falls back to page 1 for a malformed value rather than erroring", () => {
    expect(paginationSchema.parse({ page: "not-a-number" })).toEqual({
      page: 1,
    });
    expect(paginationSchema.parse({ page: "0" })).toEqual({ page: 1 });
    expect(paginationSchema.parse({ page: "-4" })).toEqual({ page: 1 });
  });
});

describe("paginationMeta", () => {
  it("computes skip/take for a middle page", () => {
    const meta = paginationMeta(120, 2);
    expect(meta).toEqual({
      page: 2,
      pageCount: Math.ceil(120 / PAGE_SIZE),
      total: 120,
      skip: PAGE_SIZE,
      take: PAGE_SIZE,
    });
  });

  it("always reports at least one page, even with zero rows", () => {
    expect(paginationMeta(0, 1)).toEqual({
      page: 1,
      pageCount: 1,
      total: 0,
      skip: 0,
      take: PAGE_SIZE,
    });
  });

  it("clamps a stale page number down to the last real page", () => {
    // A list that has since shrunk to one page shouldn't strand a bookmarked
    // ?page=9 on an empty result with no way back.
    const meta = paginationMeta(5, 9);
    expect(meta.page).toBe(1);
    expect(meta.skip).toBe(0);
  });

  it("clamps page 0 or negative up to page 1", () => {
    expect(paginationMeta(50, 0).page).toBe(1);
    expect(paginationMeta(50, -3).page).toBe(1);
  });
});
