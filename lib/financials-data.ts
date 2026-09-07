import { db } from "@/lib/db";
import { scopedWhere } from "@/lib/tenant";
import type { SessionActor } from "@/lib/permissions";
import { financialRollup, type FinancialRollup } from "@/lib/projects";
import type { ClientStatus } from "@/lib/generated/prisma/enums";

/**
 * Database access for Financials (Phases.md Phase 11).
 *
 * No pure logic here beyond composition — the arithmetic itself is
 * `financialRollup` in `lib/projects.ts`; this file's only job is shaping
 * each client's projects into `ProjectRollupInput` rows and calling it once
 * per client plus once more across everything for the agency-wide total.
 *
 * Only ever called for `canViewFinancials(actor)` — enforced by the page, not
 * here (this module has no opinion on who may call it, same as every other
 * DB-access module in this codebase).
 */

export type ClientFinancials = {
  id: string;
  name: string;
  status: ClientStatus;
  rollup: FinancialRollup;
};

export type CompanyFinancials = {
  agency: FinancialRollup;
  clients: ClientFinancials[];
};

export async function loadCompanyFinancials(
  actor: SessionActor
): Promise<CompanyFinancials> {
  const clients = await db.client.findMany({
    where: scopedWhere(actor),
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      status: true,
      projects: {
        where: { deletedAt: null },
        select: {
          value: true,
          estimatedCost: true,
          members: { select: { employeeId: true } },
          tasks: { where: { deletedAt: null }, select: { status: true } },
        },
      },
    },
  });

  const withInputs = clients.map((client) => ({
    id: client.id,
    name: client.name,
    status: client.status,
    inputs: client.projects.map((project) => ({
      value: project.value,
      estimatedCost: project.estimatedCost,
      memberIds: project.members.map((member) => member.employeeId),
      taskCount: project.tasks.length,
      doneTaskCount: project.tasks.filter((task) => task.status === "Done")
        .length,
    })),
  }));

  return {
    agency: financialRollup(withInputs.flatMap((client) => client.inputs)),
    clients: withInputs.map(({ inputs, ...client }) => ({
      ...client,
      rollup: financialRollup(inputs),
    })),
  };
}
