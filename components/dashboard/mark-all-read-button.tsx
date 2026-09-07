"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Marks every one of the actor's own notifications read, then refreshes the
 * server-rendered list (Phases.md Phase 12 — the `/notifications` page). */
export function MarkAllReadButton() {
  const router = useRouter();

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={markAllRead}>
      Mark all read
    </Button>
  );
}
