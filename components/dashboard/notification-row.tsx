"use client";

import { useRouter } from "next/navigation";
import { cn } from "cn";
import { formatDateTime } from "@/lib/format";

export type NotificationRowData = {
  id: string;
  message: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

/**
 * One row on `/notifications` — mirrors `NotificationBell`'s
 * `openNotification`: marks itself read on click before navigating, rather
 * than requiring a separate "mark read" control per row.
 */
export function NotificationRow({
  notification,
}: {
  notification: NotificationRowData;
}) {
  const router = useRouter();

  async function open() {
    if (!notification.readAt) {
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: "PATCH",
      });
      router.refresh();
    }
    if (notification.link) router.push(notification.link);
  }

  return (
    <li>
      <button
        type="button"
        onClick={open}
        className={cn(
          "hover:bg-surface-muted flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors",
          !notification.readAt && "bg-brand-yellow-light/40"
        )}
      >
        <span className="text-foreground">{notification.message}</span>
        <span className="text-text-secondary text-meta">
          {formatDateTime(notification.createdAt)}
        </span>
      </button>
    </li>
  );
}
