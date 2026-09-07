import { db } from "@/lib/db";
import type { SessionActor } from "@/lib/permissions";
import {
  requestDecidedMessage,
  requestSubmittedMessage,
  resolveApproversFor,
} from "@/lib/notifications";
import { sendEmail, requestDecisionEmailBody } from "@/lib/mailer";
import { paginationMeta, type PaginationMeta } from "@/lib/pagination";
import type { RequestStatus, RequestType } from "@/lib/generated/prisma/enums";

/**
 * Database access for notifications (Architecture.md section 7 — "event
 * handler creates an in-app notification + queues email").
 *
 * Two events fire here, both from Phase 7: a request is submitted (its
 * approvers are notified in-app) and a request is decided (the submitting
 * employee is notified in-app and, best-effort, by email). Neither ever
 * throws — like `safeRecalcEmployeeWorkload`, a failure here must never turn
 * a saved request into a 500.
 */

/** Which recipient column a query or write should use for this actor. */
function recipientWhere(actor: SessionActor) {
  return actor.accountType === "employee"
    ? { recipientEmployeeId: actor.id }
    : { recipientAccountId: actor.id };
}

async function notify(data: {
  companyId: string;
  recipientEmployeeId?: string;
  recipientAccountId?: string;
  message: string;
  link?: string;
}) {
  try {
    await db.notification.create({ data });
  } catch (cause) {
    console.error("[notifications] Could not create a notification", {
      cause,
    });
  }
}

/** A new request was submitted — tell whoever can decide on it. */
export async function notifyRequestSubmitted(request: {
  id: string;
  companyId: string;
  type: RequestType;
  subject: string;
  employee: { id: string; fullName: string; managerAccountId: string | null };
}): Promise<void> {
  try {
    const accounts = await db.companyAccount.findMany({
      where: { companyId: request.companyId, deletedAt: null },
      select: { id: true, role: true },
    });

    const approverIds = resolveApproversFor(accounts, request.employee);

    await Promise.all(
      approverIds.map((id) =>
        notify({
          companyId: request.companyId,
          recipientAccountId: id,
          message: requestSubmittedMessage(
            request.employee.fullName,
            request.type,
            request.subject
          ),
          link: `/requests/${request.id}`,
        })
      )
    );
  } catch (cause) {
    console.error("[notifications] Could not notify approvers", { cause });
  }
}

/**
 * A request was approved or rejected — tell the employee in-app and, if email
 * is configured, by email too (`lib/mailer.ts` logs instead of sending when
 * it is not).
 */
export async function notifyRequestDecided(request: {
  id: string;
  companyId: string;
  subject: string;
  status: RequestStatus;
  decisionNote: string | null;
  employee: {
    id: string;
    fullName: string;
    companyEmail: string;
    personalEmail: string | null;
  };
}): Promise<void> {
  try {
    await notify({
      companyId: request.companyId,
      recipientEmployeeId: request.employee.id,
      message: requestDecidedMessage(request.subject, request.status),
      link: `/my-space/requests/${request.id}`,
    });

    const { subject, text } = requestDecisionEmailBody({
      employeeName: request.employee.fullName,
      requestSubject: request.subject,
      status: request.status,
      decisionNote: request.decisionNote,
    });

    await sendEmail({
      to: request.employee.personalEmail ?? request.employee.companyEmail,
      subject,
      text,
    });
  } catch (cause) {
    console.error("[notifications] Could not notify the employee", { cause });
  }
}

// ---------------------------------------------------------------------------
// Reading and clearing notifications (the bell)
// ---------------------------------------------------------------------------

export type LoadedNotification = {
  id: string;
  message: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

/** Most recent notifications for the signed-in actor, read or not. */
export function loadNotifications(
  actor: SessionActor,
  limit = 20
): Promise<LoadedNotification[]> {
  return db.notification.findMany({
    where: { companyId: actor.companyId, ...recipientWhere(actor) },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      message: true,
      link: true,
      readAt: true,
      createdAt: true,
    },
  });
}

export type LoadedNotificationPage = {
  notifications: LoadedNotification[];
} & PaginationMeta;

/**
 * The full, paginated notification history (Phases.md Phase 12 —
 * notification refinement adds `/notifications` alongside the bell's
 * last-20 dropdown, which keeps calling `loadNotifications` above
 * unchanged).
 */
export async function loadNotificationsPage(
  actor: SessionActor,
  requestedPage: number
): Promise<LoadedNotificationPage> {
  const where = { companyId: actor.companyId, ...recipientWhere(actor) };
  const total = await db.notification.count({ where });
  const meta = paginationMeta(total, requestedPage);

  const notifications = await db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      link: true,
      readAt: true,
      createdAt: true,
    },
    skip: meta.skip,
    take: meta.take,
  });

  return { notifications, ...meta };
}

export function unreadNotificationCount(actor: SessionActor): Promise<number> {
  return db.notification.count({
    where: {
      companyId: actor.companyId,
      ...recipientWhere(actor),
      readAt: null,
    },
  });
}

/** Marks one notification read. A no-op if it isn't the actor's own. */
export async function markNotificationRead(
  actor: SessionActor,
  id: string
): Promise<void> {
  await db.notification.updateMany({
    where: { id, companyId: actor.companyId, ...recipientWhere(actor) },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(
  actor: SessionActor
): Promise<void> {
  await db.notification.updateMany({
    where: {
      companyId: actor.companyId,
      ...recipientWhere(actor),
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}
