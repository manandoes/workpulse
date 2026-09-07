import Link from "next/link";
import { Building2, User } from "lucide-react";
import type { OrgNode } from "@/lib/employees";
import { EmployeeStatusBadge } from "@/components/employees/status-badge";

/**
 * Reporting structure (Phases.md Phase 3 — "org structure, manager to
 * reports").
 *
 * Rendered as nested lists rather than a canvas drawing: it stays keyboard
 * navigable, screen readers announce the nesting as the hierarchy it is, and it
 * reflows on a phone without horizontal scrolling.
 */
export function OrgTree({ nodes }: { nodes: OrgNode[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {nodes.map((node) => (
        <OrgBranch key={node.key} node={node} />
      ))}
    </ul>
  );
}

function OrgBranch({ node }: { node: OrgNode }) {
  const Icon = node.kind === "account" ? Building2 : User;

  return (
    <li>
      <div className="flex flex-wrap items-center gap-2">
        <Icon
          aria-hidden
          className="text-text-secondary size-4 shrink-0"
          strokeWidth={1.5}
        />

        {node.kind === "employee" ? (
          <Link
            href={`/employees/${node.id}`}
            className="text-brand-brown font-medium underline-offset-4 hover:underline"
          >
            {node.name}
          </Link>
        ) : (
          <span className="text-brand-brown font-medium">{node.name}</span>
        )}

        <span className="text-text-secondary text-meta">{node.subtitle}</span>

        {node.status ? <EmployeeStatusBadge status={node.status} /> : null}
      </div>

      {node.children.length > 0 ? (
        <ul className="border-border mt-3 ml-2 flex flex-col gap-3 border-l pl-5">
          {node.children.map((child) => (
            <OrgBranch key={child.key} node={child} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
