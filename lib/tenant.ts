import type { SessionActor } from "@/lib/permissions";

/**
 * Tenant scoping (Rules.md section 2, Phases.md Phase 2).
 *
 * Every company-scoped query must go through this rather than hand-writing
 * `companyId`, so a forgotten filter cannot leak one company's rows into
 * another company's view.
 *
 * Usage:
 *   db.employee.findMany({ where: scopedWhere(actor, { status: "Active" }) })
 *
 * Kept in its own module — free of NextAuth and Prisma imports — so it can be
 * unit-tested directly. It is the single most security-critical helper in the
 * codebase.
 */
export function scopedWhere<T extends Record<string, unknown>>(
  actor: SessionActor,
  where?: T
): T & { companyId: string; deletedAt: null } {
  return {
    ...(where ?? ({} as T)),
    // Applied last so a caller-supplied `companyId` can never override the
    // session's tenant.
    companyId: actor.companyId,
    deletedAt: null,
  };
}

/**
 * Belt-and-braces check for records fetched by primary key, where a `where`
 * clause alone would not have applied the tenant filter.
 */
export function assertSameCompany(
  actor: SessionActor,
  record: { companyId: string } | null | undefined
): void {
  if (!record || record.companyId !== actor.companyId) {
    throw new Error("Cross-tenant access blocked");
  }
}
