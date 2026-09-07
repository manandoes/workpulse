"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField, type SelectOption } from "@/components/forms/fields";
import { EmployeeStatusBadge } from "@/components/employees/status-badge";
import { WorkloadBar } from "@/components/dashboard/workload-bar";
import type { EmployeeStatus } from "@/lib/generated/prisma/enums";

/**
 * The project team (Phases.md Phase 4 — "assign employees to a project").
 *
 * Adding and removing are single actions against
 * `/api/projects/[id]/team` rather than a form to save, so the page always
 * shows what the database holds.
 */
export type TeamMember = {
  employeeId: string;
  fullName: string;
  jobRole: string | null;
  departmentName: string | null;
  status: EmployeeStatus;
  /** Phases.md Phase 6 — the number a manager weighs before handing out work. */
  workloadPercent: number | null;
};

export function ProjectTeam({
  projectId,
  members,
  candidates,
  canManage,
}: {
  projectId: string;
  members: TeamMember[];
  /** Employees who can still be added — computed server-side. */
  candidates: SelectOption[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState("");

  async function send(method: "POST" | "DELETE", employeeId: string) {
    setBusy(true);

    const response = await fetch(`/api/projects/${projectId}/team`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId }),
    });

    const body = await response.json().catch(() => null);
    setBusy(false);

    if (!response.ok) {
      toast.error(body?.error ?? "Could not update the team.");
      return;
    }

    return true;
  }

  async function add() {
    if (!selected) return;
    const ok = await send("POST", selected);
    if (!ok) return;

    setSelected("");
    toast.success("Added to the team");
    router.refresh();
  }

  async function remove(member: TeamMember) {
    if (
      !window.confirm(
        `Take ${member.fullName} off this project? Their employee record and history are not affected.`
      )
    ) {
      return;
    }

    const ok = await send("DELETE", member.employeeId);
    if (!ok) return;

    toast.success(`${member.fullName} removed from the team`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {members.length === 0 ? (
        <p className="text-text-secondary">
          Nobody is assigned yet.
          {canManage ? " Add the first team member below." : ""}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-(--color-border)">
          {members.map((member) => (
            <li
              key={member.employeeId}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0"
            >
              <div className="flex flex-col gap-0.5">
                <Link
                  href={`/employees/${member.employeeId}`}
                  className="text-brand-brown font-medium underline-offset-4 hover:underline"
                >
                  {member.fullName}
                </Link>
                <span className="text-text-secondary text-meta">
                  {[member.jobRole, member.departmentName]
                    .filter(Boolean)
                    .join(" · ") || "No role set"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <WorkloadBar
                  percent={member.workloadPercent}
                  className="w-32"
                />
                <EmployeeStatusBadge status={member.status} />
                {canManage ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => remove(member)}
                  >
                    <UserMinus aria-hidden />
                    <span className="sr-only sm:not-sr-only">Remove</span>
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        candidates.length === 0 ? (
          <p className="text-text-secondary text-meta">
            Everyone who can be staffed is already on this team.
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <SelectField
              id="addMember"
              label="Add a team member"
              placeholder="Choose an employee"
              options={candidates}
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
              fieldClassName="min-w-64 flex-1"
            />
            <Button
              type="button"
              onClick={add}
              disabled={busy || !selected}
              className="h-9"
            >
              <UserPlus aria-hidden />
              {busy ? "Working…" : "Add"}
            </Button>
          </div>
        )
      ) : null}
    </div>
  );
}
