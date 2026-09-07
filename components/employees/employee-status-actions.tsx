"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { EmployeeStatus } from "@/lib/generated/prisma/enums";

/**
 * Suspend or reactivate an employee.
 *
 * Rules.md § 6: the record is never deleted. Suspension revokes the login and
 * keeps the person's history intact for the tasks, requests and performance
 * records that later phases hang off them.
 */
export function EmployeeStatusActions({
  employeeId,
  status,
  fullName,
}: {
  employeeId: string;
  status: EmployeeStatus;
  fullName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const suspended = status === "Suspended";

  async function change(target: "Active" | "Suspended") {
    if (
      target === "Suspended" &&
      !window.confirm(
        `Suspend ${fullName}? They will not be able to sign in. Their record and history are kept, and you can reactivate them later.`
      )
    ) {
      return;
    }

    setBusy(true);

    const response = await fetch(`/api/employees/${employeeId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: target }),
    });

    const body = await response.json().catch(() => null);
    setBusy(false);

    if (!response.ok) {
      toast.error(body?.error ?? "Could not change their status.");
      return;
    }

    if (body.status === "Invited") {
      // They never accepted their invite, so there is no password to restore.
      toast.warning(
        `${fullName} is back to Invited — they still need to accept their invite link.`
      );
    } else {
      toast.success(
        target === "Suspended"
          ? `${fullName} has been suspended.`
          : `${fullName} has been reactivated.`
      );
    }

    router.refresh();
  }

  return suspended ? (
    <Button
      type="button"
      variant="outline"
      disabled={busy}
      onClick={() => change("Active")}
    >
      {busy ? "Working…" : "Reactivate"}
    </Button>
  ) : (
    <Button
      type="button"
      variant="destructive"
      disabled={busy}
      onClick={() => change("Suspended")}
    >
      {busy ? "Working…" : "Suspend access"}
    </Button>
  );
}
