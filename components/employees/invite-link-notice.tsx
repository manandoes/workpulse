"use client";

import { toast } from "sonner";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown when an invite was created but the email could not be sent.
 *
 * Email delivery is unconfigured in development, and can fail in production.
 * Rather than letting the invite silently go nowhere, the one-time link is
 * surfaced to the admin who created it — they have already been authorised to
 * invite this person, so showing them the link reveals nothing new.
 */
export function InviteLinkNotice({
  url,
  description,
}: {
  url: string;
  description: string;
}) {
  return (
    <div className="border-warning bg-surface-muted flex flex-col gap-2 rounded-lg border-l-4 px-4 py-3">
      <p className="text-brand-brown font-medium">Share this invite link</p>
      <p className="text-text-secondary text-meta">{description}</p>
      <div className="flex items-center gap-2">
        <code className="bg-surface border-border text-meta min-w-0 flex-1 truncate rounded-lg border px-3 py-2">
          {url}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            toast.success("Invite link copied");
          }}
        >
          <Copy aria-hidden />
          Copy
        </Button>
      </div>
    </div>
  );
}
