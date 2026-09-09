import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActor } from "@/lib/auth";
import {
  loadNotificationsPage,
  unreadNotificationCount,
} from "@/lib/notification-data";
import { paginationSchema } from "@/lib/pagination";
import { EmptyState, PageHeader } from "@/components/dashboard/page-header";
import { Pagination } from "@/components/dashboard/pagination";
import { MarkAllReadButton } from "@/components/dashboard/mark-all-read-button";
import { NotificationRow } from "@/components/dashboard/notification-row";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Notifications — WorkPulse" };

/**
 * The full notification history (Phases.md Phase 12 — notification
 * refinement), reachable for both account types like the bell already is.
 * The bell's own dropdown stays the last-20 unread-first glance; this is the
 * paginated record of everything.
 */
export default async function NotificationsPage({
  searchParams,
}: PageProps<"/notifications">) {
  const actor = await getActor();
  if (!actor) redirect("/login");

  const query = await searchParams;
  const { page: requestedPage } = paginationSchema.parse(query);

  const [{ notifications, ...meta }, unreadCount] = await Promise.all([
    loadNotificationsPage(actor, requestedPage),
    unreadNotificationCount(actor),
  ]);

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Everything you've been notified about, newest first."
        action={unreadCount > 0 ? <MarkAllReadButton /> : undefined}
      />

      {notifications.length === 0 ? (
        <EmptyState
          title="Nothing yet"
          description="Notifications about requests you submit or decide on will show up here."
        />
      ) : (
        <>
          <Card size="sm">
            <ul className="divide-border divide-y">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={{
                    id: notification.id,
                    message: notification.message,
                    link: notification.link,
                    readAt: notification.readAt?.toISOString() ?? null,
                    createdAt: notification.createdAt.toISOString(),
                  }}
                />
              ))}
            </ul>
          </Card>
          <Pagination basePath="/notifications" query={query} meta={meta} />
        </>
      )}
    </>
  );
}
