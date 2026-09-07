"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ClientStatus } from "@/lib/generated/prisma/enums";

/**
 * Archive or restore a client.
 *
 * Rules.md § 6: the record is never deleted — projects, and the tasks and
 * invoices that will later hang off them, keep pointing at a client that still
 * exists. Archiving takes them out of the picker for new work.
 */
export function ClientStatusActions({
  clientId,
  status,
  name,
  projectCount,
}: {
  clientId: string;
  status: ClientStatus;
  name: string;
  projectCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const archived = status === "Archived";

  async function change(target: ClientStatus) {
    if (target === "Archived") {
      const consequence =
        projectCount === 0
          ? ""
          : ` Their ${projectCount === 1 ? "project stays" : `${projectCount} projects stay`} exactly as ${projectCount === 1 ? "it is" : "they are"}.`;

      if (
        !window.confirm(
          `Archive ${name}? They will not be offered when starting a new project.${consequence}`
        )
      ) {
        return;
      }
    }

    setBusy(true);

    const response = await fetch(`/api/clients/${clientId}/status`, {
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

    toast.success(
      target === "Archived" ? `${name} archived.` : `${name} restored.`
    );
    router.refresh();
  }

  return archived ? (
    <Button
      type="button"
      variant="outline"
      disabled={busy}
      onClick={() => change("Active")}
    >
      {busy ? "Working…" : "Restore client"}
    </Button>
  ) : (
    <Button
      type="button"
      variant="destructive"
      disabled={busy}
      onClick={() => change("Archived")}
    >
      {busy ? "Working…" : "Archive client"}
    </Button>
  );
}
