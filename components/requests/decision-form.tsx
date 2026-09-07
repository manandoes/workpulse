"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/forms/fields";

/**
 * Approve or reject a request (Phases.md Phase 7 — "approve/reject/comment").
 *
 * One optional note goes with whichever decision is made — there is no
 * separate comment thread (see the schema.prisma note on `Request.decisionNote`).
 */
export function DecisionForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function decide(status: "Approved" | "Rejected") {
    setBusy(true);

    const response = await fetch(`/api/requests/${requestId}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, decisionNote: note }),
    });

    const body = await response.json().catch(() => null);
    setBusy(false);

    if (!response.ok) {
      toast.error(body?.error ?? "Could not record that decision.");
      return;
    }

    toast.success(
      status === "Approved" ? "Request approved" : "Request rejected"
    );
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <TextareaField
        id="decisionNote"
        label="Note (optional)"
        rows={3}
        placeholder="Shown to the employee alongside your decision."
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={busy}
          onClick={() => decide("Approved")}
        >
          <Check aria-hidden />
          Approve
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => decide("Rejected")}
        >
          <X aria-hidden />
          Reject
        </Button>
      </div>
    </div>
  );
}
