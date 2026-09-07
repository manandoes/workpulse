"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Remove a task (Phases.md Phase 5).
 *
 * Soft-deleted server-side, so the row survives for the workload and
 * performance figures that are computed from it — but it is gone from every
 * view, which is what "delete" has to mean to the person clicking it. The
 * confirmation says so rather than implying the record is destroyed.
 */
export function DeleteTaskButton({
  taskId,
  title,
}: {
  taskId: string;
  title: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (
      !window.confirm(
        `Delete "${title}"? It disappears from the board and the lists, along with its comments and attachments.`
      )
    ) {
      return;
    }

    setBusy(true);

    const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      setBusy(false);
      toast.error(body?.error ?? "Could not delete this task.");
      return;
    }

    toast.success(`${title} deleted`);
    router.push("/tasks");
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" disabled={busy} onClick={remove}>
      <Trash2 aria-hidden />
      {busy ? "Deleting…" : "Delete"}
    </Button>
  );
}
