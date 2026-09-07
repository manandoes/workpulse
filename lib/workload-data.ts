import { db } from "@/lib/db";
import { calculateWorkloadPercent, type WorkloadTask } from "@/lib/workload";
import { OPEN_STATUSES } from "@/lib/tasks";

/**
 * Workload recomputation (Phases.md Phase 6).
 *
 * Kept separate from `lib/workload.ts`, the same split `task-data.ts` draws
 * from `tasks.ts`: this module touches the database, the other is pure and
 * unit-tested directly. These functions run without a `SessionActor` — they
 * are called from task-write routes (where the tenant is already proven by
 * `scopedWhere` further up the call) and from the background sweep, which by
 * definition crosses every tenant — so they take a `companyId` directly rather
 * than going through `scopedWhere`.
 */

const taskSelect = {
  status: true,
  dueDate: true,
  estimatedHours: true,
} as const;

/** Recompute and store one employee's workload %. Returns the new value. */
export async function recalcEmployeeWorkload(
  companyId: string,
  employeeId: string,
  now: Date = new Date()
): Promise<number> {
  const [company, tasks] = await Promise.all([
    db.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { weeklyCapacityHours: true },
    }),
    db.task.findMany({
      where: {
        companyId,
        assigneeId: employeeId,
        status: { in: [...OPEN_STATUSES] },
        deletedAt: null,
      },
      select: taskSelect,
    }),
  ]);

  const percent = calculateWorkloadPercent(
    tasks as WorkloadTask[],
    company.weeklyCapacityHours,
    now
  );

  await db.employee.update({
    where: { id: employeeId },
    data: { workloadPercent: percent, workloadUpdatedAt: now },
  });

  return percent;
}

/**
 * Recompute every employee in a company.
 *
 * One capacity read and one grouped task read for the whole company, rather
 * than one round trip per employee. Employees with no open tasks are set to 0
 * explicitly, so a workload can never sit stale at an old high number after
 * every task assigned to someone is finished, moved away, or deleted.
 */
export async function recalcCompanyWorkload(
  companyId: string,
  now: Date = new Date()
): Promise<number> {
  const [company, employees, tasks] = await Promise.all([
    db.company.findUniqueOrThrow({
      where: { id: companyId },
      select: { weeklyCapacityHours: true },
    }),
    db.employee.findMany({
      where: { companyId, deletedAt: null },
      select: { id: true },
    }),
    db.task.findMany({
      where: {
        companyId,
        assigneeId: { not: null },
        status: { in: [...OPEN_STATUSES] },
        deletedAt: null,
      },
      select: { assigneeId: true, ...taskSelect },
    }),
  ]);

  const byEmployee = new Map<string, WorkloadTask[]>();
  for (const task of tasks) {
    const id = task.assigneeId as string;
    (byEmployee.get(id) ?? byEmployee.set(id, []).get(id)!).push(task);
  }

  await db.$transaction(
    employees.map(({ id }) =>
      db.employee.update({
        where: { id },
        data: {
          workloadPercent: calculateWorkloadPercent(
            byEmployee.get(id) ?? [],
            company.weeklyCapacityHours,
            now
          ),
          workloadUpdatedAt: now,
        },
      })
    )
  );

  return employees.length;
}

/**
 * `recalcEmployeeWorkload`, but never throws.
 *
 * Called from task-write routes after the task itself is already saved — a
 * failure to recompute a side-effect number must never turn into a 500 for a
 * task the user successfully saved (Rules.md section 4). Logged the same way
 * `serverError` logs a real route failure, so it is not silently lost either.
 */
export async function safeRecalcEmployeeWorkload(
  companyId: string,
  employeeId: string | null
): Promise<void> {
  if (!employeeId) return;

  try {
    await recalcEmployeeWorkload(companyId, employeeId);
  } catch (cause) {
    console.error("[workload-recalc-error]", { companyId, employeeId, cause });
  }
}

/**
 * The periodic sweep (Architecture.md's `jobs/recalculateWorkload.ts` names
 * this exact function, run over HTTP rather than a queue — see that file).
 *
 * Loops companies rather than one set-based query across the whole database:
 * simplest correct thing at v1 scale, and the place to optimize first if a
 * real deployment ever makes this slow.
 */
export async function recalcAllCompanies(
  now: Date = new Date()
): Promise<{ companies: number; employees: number }> {
  const companies = await db.company.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  let employees = 0;
  for (const company of companies) {
    employees += await recalcCompanyWorkload(company.id, now);
  }

  return { companies: companies.length, employees };
}
