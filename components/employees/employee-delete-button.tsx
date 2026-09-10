"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Removes an employee from the directory.
 *
 * Rules.md § 6: the record is never hard-deleted — the API sets `deletedAt`,
 * the same soft-delete the status route uses for suspension. The employee
 * disappears from every list immediately; their task/request/performance
 * history is kept.
 */
export function EmployeeDeleteButton({
  employeeId,
  fullName,
}: {
  employeeId: string;
  fullName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (
      !window.confirm(
        `Delete ${fullName}? They will be removed from the directory, org chart and all lists. Their task, request and performance history is kept.`
      )
    ) {
      return;
    }

    setBusy(true);

    const response = await fetch(`/api/employees/${employeeId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setBusy(false);
      toast.error(body?.error ?? "Could not delete this employee.");
      return;
    }

    toast.success(`${fullName} has been deleted.`);
    router.push("/employees");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={busy}
      onClick={handleDelete}
    >
      <Trash2 aria-hidden />
      {busy ? "Deleting…" : "Delete employee"}
    </Button>
  );
}
