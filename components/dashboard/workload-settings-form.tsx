"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormError, FormField } from "@/components/forms/fields";
import {
  workloadSettingsSchema,
  type WorkloadSettingsInput,
} from "@/lib/validations/settings";

/**
 * Change the weekly capacity hours a workload of 100% represents
 * (Phases.md Phase 6).
 *
 * A single field: the number every employee's cached percentage is computed
 * from. Saving recalculates every employee's workload immediately, so the
 * form warns what it is about to change rather than saving it as a quiet
 * side effect.
 */
export function WorkloadSettingsForm({
  weeklyCapacityHours,
}: {
  weeklyCapacityHours: number;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WorkloadSettingsInput>({
    resolver: zodResolver(workloadSettingsSchema),
    defaultValues: { weeklyCapacityHours: String(weeklyCapacityHours) },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const response = await fetch("/api/settings/workload", {
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
          setError(field as keyof WorkloadSettingsInput, { message });
        }
      }
      setFormError(body?.error ?? "Could not save this.");
      return;
    }

    toast.success(
      `Weekly capacity set to ${body.weeklyCapacityHours}h. Every employee's workload has been recalculated.`
    );
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormError message={formError} />

      <FormField
        id="weeklyCapacityHours"
        label="Weekly capacity (hours)"
        hint="A workload of 100% means an employee's open, weighted task hours equal this many hours. Saving recalculates everyone's percentage."
        inputMode="numeric"
        fieldClassName="max-w-xs"
        error={errors.weeklyCapacityHours?.message}
        {...register("weeklyCapacityHours")}
      />

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
