"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Search and filters for a directory-style list — employees, projects, clients.
 *
 * State lives in the URL rather than in React state, so a filtered list can be
 * linked, bookmarked and reloaded, and the server component does the filtering:
 * there is no client-side copy of the list to keep in sync.
 *
 * The free-text box is always `q`; every other filter is a select declared by
 * the page, so each list names its own filters while the behaviour — apply on
 * change, clear all, keep the rest of the query intact — is written once.
 */

export type FilterSelect = {
  /** Query parameter, and the name of the control. */
  name: string;
  label: string;
  /** The empty first option, e.g. "All departments". */
  anyLabel: string;
  options: { value: string; label: string }[];
};

export function ListFilters({
  basePath,
  searchLabel = "Search",
  searchPlaceholder,
  selects,
  preserve = [],
}: {
  basePath: string;
  searchLabel?: string;
  searchPlaceholder: string;
  selects: FilterSelect[];
  /**
   * Query parameters that are part of the URL but are not filters — the task
   * page's `view`, for example. They are carried through both filtering and
   * clearing, so choosing the board and then searching does not throw you back
   * to the list.
   */
  preserve?: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const names = ["q", ...selects.map((select) => select.name)];
  const current = Object.fromEntries(
    [...names, ...preserve].map((name) => [name, searchParams.get(name) ?? ""])
  );

  const hasFilters = names.some((name) => current[name]);

  function urlFor(values: Record<string, string>) {
    const params = new URLSearchParams();

    for (const name of [...names, ...preserve]) {
      if (values[name]) params.set(name, values[name]);
    }

    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  function apply(changes: Record<string, string>) {
    router.push(urlFor({ ...current, ...changes }));
  }

  return (
    <form
      className="mb-6 flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("q");
        apply({ q: typeof value === "string" ? value : "" });
      }}
    >
      <div className="flex min-w-56 flex-1 flex-col gap-1.5">
        <Label htmlFor="q" className="text-brand-brown font-medium">
          {searchLabel}
        </Label>
        <div className="flex gap-2">
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={current.q}
            placeholder={searchPlaceholder}
            className="h-9"
          />
          <Button type="submit" variant="outline" size="sm" className="h-9">
            <Search aria-hidden />
            <span className="sr-only sm:not-sr-only">Search</span>
          </Button>
        </div>
      </div>

      {selects.map((select) => (
        <div key={select.name} className="flex flex-col gap-1.5">
          <Label htmlFor={select.name} className="text-brand-brown font-medium">
            {select.label}
          </Label>
          <select
            id={select.name}
            name={select.name}
            value={current[select.name]}
            onChange={(event) => apply({ [select.name]: event.target.value })}
            className="border-input bg-surface text-foreground h-9 rounded-lg border px-3"
          >
            <option value="">{select.anyLabel}</option>
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() =>
            router.push(
              // Clearing drops the filters and keeps everything else.
              urlFor(
                Object.fromEntries(
                  preserve.map((name) => [name, current[name]])
                )
              )
            )
          }
        >
          <X aria-hidden />
          Clear
        </Button>
      ) : null}
    </form>
  );
}
