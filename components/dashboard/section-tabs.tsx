"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

/**
 * Sub-navigation within a dashboard section — Employees, Projects, and the
 * sections still to come.
 *
 * Design.md § 6 uses `brand-yellow-light` with `brand-brown` text for the
 * selected item, matching the sidebar's active state.
 */
export function SectionTabs({
  label,
  items,
}: {
  /** Names the nav for screen readers, e.g. "Employees sections". */
  label: string;
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  const root = items[0]?.href;

  return (
    <nav aria-label={label} className="mb-6 flex flex-wrap gap-1">
      {items.map((item) => {
        /**
         * The section root matches exactly; every other tab also owns its
         * children. Without this, a page under the root would light up two tabs
         * at once, because every href in the section starts with the root.
         */
        const isActive =
          item.href === root
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 font-medium transition-colors",
              isActive
                ? "bg-brand-yellow-light text-brand-brown"
                : "text-text-secondary hover:text-brand-brown hover:bg-surface-muted"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
