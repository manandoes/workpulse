import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  apiError,
  forbidden,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/api";
import { getActor } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageWorkloadSettings } from "@/lib/permissions";
import { workloadSettingsSchema } from "@/lib/validations/settings";
import { recalcCompanyWorkload } from "@/lib/workload-data";

/**
 * PATCH /api/settings/workload — change the weekly capacity hours a workload
 * of 100% represents (Phases.md Phase 6).
 *
 * The capacity is company-wide, so changing it moves every employee's
 * percentage at once — the recalculation runs synchronously here rather than
 * waiting for the next task write or the periodic sweep, so the number on
 * screen is never stale after the very change that was meant to fix it.
 */
export async function PATCH(request: NextRequest) {
  const actor = await getActor();
  if (!actor) return unauthorized();

  if (!canManageWorkloadSettings(actor)) {
    return forbidden(
      "Only owners, admins and managers can change workload capacity."
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("Expected a JSON body.", 400, "invalid_json");
  }

  const parsed = workloadSettingsSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const weeklyCapacityHours = Number(parsed.data.weeklyCapacityHours);

    await db.company.update({
      where: { id: actor.companyId },
      data: { weeklyCapacityHours },
    });

    await recalcCompanyWorkload(actor.companyId);

    return NextResponse.json({ weeklyCapacityHours });
  } catch (cause) {
    return serverError(
      {
        route: "PATCH /api/settings/workload",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
