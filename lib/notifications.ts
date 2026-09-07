import { requestStatusLabel, requestTypeLabel } from "@/lib/requests";
import type { RequestStatus, RequestType } from "@/lib/generated/prisma/enums";

/**
 * Pure notification logic (Rules.md section 5) — free of Prisma/NextAuth
 * imports, like `lib/tasks.ts`/`lib/requests.ts`, so it can be unit-tested
 * directly. The database-touching half lives in `lib/notification-data.ts`,
 * the same split `lib/tasks.ts`/`lib/task-data.ts` already draws.
 */

export type ApproverAccount = { id: string; role: string };

/**
 * Which company accounts should hear about a new request from this employee.
 *
 * Owner/Admin/HR can decide on anyone's request (`canApproveRequests` minus
 * the Manager case), so they always hear about a new one. A Manager only
 * decides on their own direct reports (`canDecideOnRequest`), so only the
 * employee's own manager account — and only if that account is a Manager —
 * is added on top. Deduplicated, since a manager account might already be an
 * Owner/Admin/HR account in an unusual setup.
 */
export function resolveApproversFor(
  accounts: ApproverAccount[],
  employee: { managerAccountId: string | null }
): string[] {
  const ids = new Set<string>();

  for (const account of accounts) {
    if (
      account.role === "Owner" ||
      account.role === "Admin" ||
      account.role === "HR"
    ) {
      ids.add(account.id);
    }
  }

  if (employee.managerAccountId) {
    const manager = accounts.find((a) => a.id === employee.managerAccountId);
    if (manager?.role === "Manager") ids.add(manager.id);
  }

  return [...ids];
}

/**
 * What a request's approvers see when it is submitted.
 *
 * The type name sits in parentheses rather than before the word "request":
 * `requestTypeLabel` already reads naturally as a request name for some types
 * ("HR request", "Document request") but not others ("Leave", "Reimbursement"),
 * and this phrasing reads correctly for all eight without special-casing any.
 */
export function requestSubmittedMessage(
  employeeName: string,
  type: RequestType,
  subject: string
): string {
  return `${employeeName} submitted a new request (${requestTypeLabel(type)}): ${subject}`;
}

/** What the employee sees when their request is decided. */
export function requestDecidedMessage(
  subject: string,
  status: RequestStatus
): string {
  return `Your request "${subject}" was ${requestStatusLabel(status).toLowerCase()}.`;
}
