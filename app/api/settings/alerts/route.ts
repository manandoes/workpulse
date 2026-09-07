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
import { canManageCompanySettings } from "@/lib/permissions";
import { alertSettingsSchema } from "@/lib/validations/settings";

/**
 * PATCH /api/settings/alerts — change the early-warning thresholds
 * (Phases.md Phase 9).
 *
 * Owner/Admin only (confirmed with the user) — a company-wide alerting
 * policy, narrower than the workload-capacity setting Managers can also
 * tune. No recompute here: the next dashboard load (or the periodic sweep)
 * regenerates alerts against the new thresholds.
 */
export async function PATCH(request: NextRequest) {
  const actor = await getActor();
  if (!actor) return unauthorized();

  if (!canManageCompanySettings(actor)) {
    return forbidden("Only owners and admins can change alert thresholds.");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return apiError("Expected a JSON body.", 400, "invalid_json");
  }

  const parsed = alertSettingsSchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const updated = await db.company.update({
      where: { id: actor.companyId },
      data: {
        overloadThresholdPercent: Number(parsed.data.overloadThresholdPercent),
        stalledProjectDays: Number(parsed.data.stalledProjectDays),
        agingApprovalDays: Number(parsed.data.agingApprovalDays),
      },
      select: {
        overloadThresholdPercent: true,
        stalledProjectDays: true,
        agingApprovalDays: true,
      },
    });

    return NextResponse.json(updated);
  } catch (cause) {
    return serverError(
      {
        route: "PATCH /api/settings/alerts",
        companyId: actor.companyId,
        actorId: actor.id,
      },
      cause
    );
  }
}
