/**
 * Company slugs — the public tenant identifier employees type on the login
 * form and that appears in invite links.
 */

const MAX_SLUG_LENGTH = 40;

/**
 * Slugs are part of a URL and are typed by employees, so they are restricted to
 * lowercase letters, digits and single hyphens.
 */
export function slugify(input: string): string {
  return (
    input
      .normalize("NFKD")
      // Strip accents so "Süd Agentur" becomes "sud-agentur" rather than losing
      // the character entirely.
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, MAX_SLUG_LENGTH)
      .replace(/-+$/g, "")
  );
}

/**
 * Find a free slug by appending -2, -3, ... when the preferred one is taken.
 *
 * `isTaken` is injected so this stays a pure, testable function and the caller
 * owns the database access.
 */
export async function uniqueSlug(
  preferred: string,
  isTaken: (candidate: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(preferred) || "company";

  if (!(await isTaken(base))) return base;

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!(await isTaken(candidate))) return candidate;
  }

  throw new Error(`Could not derive a unique slug from "${preferred}"`);
}
