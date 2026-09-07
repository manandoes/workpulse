"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "cn";
import { TASK_STATUSES } from "@/lib/tasks";
import { taskStatusLabel } from "@/components/tasks/status-badge";
import type { TaskStatus } from "@/lib/generated/prisma/enums";

/**
 * Move a task through the flow (Phases.md Phase 5 — "task status flow").
 *
 * A select rather than drag-and-drop: it moves a card with one keystroke, works
 * on a phone, is reachable by a screen reader, and needs no drag-and-drop
 * dependency (Rules.md section 1 — check the existing stack before adding a
 * package). The board and the task page share it, so a status change is the
 * same one small request wherever it is made.
 */
export function TaskStatusSelect({
  taskId,
  status,
  label = "Status",
  hideLabel,
  className,
}: {
  taskId: string;
  status: TaskStatus;
  label?: string;
  /** On a board card the column already says what the status is. */
  hideLabel?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const id = `status-${taskId}`;

  async function move(next: TaskStatus) {
    if (next === status) return;
    setBusy(true);

    const response = await fetch(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    const body = await response.json().catch(() => null);
    setBusy(false);

    if (!response.ok) {
      toast.error(body?.error ?? "Could not move this task.");
      return;
    }

    toast.success(`Moved to ${taskStatusLabel(next)}`);
    // The server owns the list, so re-read it rather than keeping a second copy
    // of the board in React state that could drift from it.
    router.refresh();
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className={cn("text-brand-brown font-medium", hideLabel && "sr-only")}
      >
        {label}
      </label>
      <select
        id={id}
        value={status}
        disabled={busy}
        onChange={(event) => move(event.target.value as TaskStatus)}
        className="border-input bg-surface text-foreground h-8 w-full rounded-lg border px-2 disabled:opacity-60"
      >
        {TASK_STATUSES.map((option) => (
          <option key={option} value={option}>
            {taskStatusLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
}
