import Link from "next/link";
import { cn } from "cn";

/**
 * The two login paths, shown as side-by-side tabs at the top of the auth card
 * (Design.md section 8 — brand-yellow marks the active path).
 *
 * These are plain links, not stateful tabs: the two paths are separate routes
 * that authenticate against separate tables (Architecture.md section 8), so
 * they must never share a form or a submit handler.
 */
const PATHS = [
  { href: "/login/company", label: "Company Login" },
  { href: "/login/employee", label: "Employee Login" },
] as const;

export function AuthPathTabs({
  active,
}: {
  active: "company" | "employee" | null;
}) {
  return (
    <div
      className="bg-surface-muted grid grid-cols-2 gap-1 rounded-lg p-1"
      role="group"
      aria-label="Choose how to sign in"
    >
      {PATHS.map((path) => {
        const isActive = active !== null && path.href.endsWith(active);

        return (
          <Link
            key={path.href}
            href={path.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-center font-medium transition-colors",
              isActive
                ? "bg-brand-yellow text-brand-brown"
                : "text-text-secondary hover:text-brand-brown"
            )}
          >
            {path.label}
          </Link>
        );
      })}
    </div>
  );
}
