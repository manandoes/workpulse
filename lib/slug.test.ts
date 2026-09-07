import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Northwind Studio")).toBe("northwind-studio");
  });

  it("collapses punctuation and repeated separators", () => {
    expect(slugify("Acme  &  Co.  Design")).toBe("acme-co-design");
  });

  it("trims leading and trailing separators", () => {
    expect(slugify("  --Hello--  ")).toBe("hello");
  });

  it("strips accents rather than dropping the letter", () => {
    expect(slugify("Süd Agentur")).toBe("sud-agentur");
  });

  it("caps the length and never ends on a hyphen", () => {
    const slug = slugify("a".repeat(60));
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("returns an empty string when nothing usable remains", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("uniqueSlug", () => {
  it("uses the preferred slug when it is free", async () => {
    expect(await uniqueSlug("Northwind Studio", async () => false)).toBe(
      "northwind-studio"
    );
  });

  it("appends a counter until it finds a free slug", async () => {
    const taken = new Set(["acme", "acme-2"]);
    expect(await uniqueSlug("Acme", async (c) => taken.has(c))).toBe("acme-3");
  });

  it("falls back to a usable base when the name has no slug characters", async () => {
    expect(await uniqueSlug("!!!", async () => false)).toBe("company");
  });
});
