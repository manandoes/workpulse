"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormError, FormField } from "@/components/forms/fields";
import {
  alertSettingsSchema,
  type AlertSettingsInput,
} from "@/lib/validations/settings";

/**
 * Change the early-warning thresholds (Phases.md Phase 9). Mirrors
 * `WorkloadSettingsForm` exactly, three fields instead of one.
 */
export function AlertSettingsForm({
  overloadThresholdPercent,
  stalledProjectDays,
  agingApprovalDays,
}: {
  overloadThresholdPercent: number;
  stalledProjectDays: number;
  agingApprovalDays: number;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AlertSettingsInput>({
    resolver: zodResolver(alertSettingsSchema),
    defaultValues: {
      overloadThresholdPercent: String(overloadThresholdPercent),
      stalledProjectDays: String(stalledProjectDays),
      agingApprovalDays: String(agingApprovalDays),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const response = await fetch("/api/settings/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      if (body?.fieldErrors) {
        for (const [field, message] of Object.entries(
          body.fieldErrors as Record<string, string>
        )) {
          setError(field as keyof AlertSettingsInput, { message });
        }
      }
      setFormError(body?.error ?? "Could not save this.");
      return;
    }

    toast.success("Alert thresholds saved.");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormError message={formError} />

      <FormField
        id="overloadThresholdPercent"
        label="Overload threshold (%)"
        hint="An employee above this workload percentage is flagged as overloaded."
        inputMode="numeric"
        fieldClassName="max-w-xs"
        error={errors.overloadThresholdPercent?.message}
        {...register("overloadThresholdPercent")}
      />

      <FormField
        id="stalledProjectDays"
        label="Stalled project (days)"
        hint="A project with no task activity for this many days is flagged as stalled."
        inputMode="numeric"
        fieldClassName="max-w-xs"
        error={errors.stalledProjectDays?.message}
        {...register("stalledProjectDays")}
      />

      <FormField
        id="agingApprovalDays"
        label="Aging approval (days)"
        hint="A pending request older than this many days is flagged as aging."
        inputMode="numeric"
        fieldClassName="max-w-xs"
        error={errors.agingApprovalDays?.message}
        {...register("agingApprovalDays")}
      />

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
