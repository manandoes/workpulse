import { z } from "zod";

/**
 * Validation for company-wide settings (Rules.md section 4 — every request
 * body is validated before anything touches the database).
 *
 * Kept as a string all the way to the integer column, the same pattern
 * `lib/validations/tasks.ts` uses for estimated hours: an untouched form field
 * always submits a string, so the schema should accept exactly what the input
 * can hold rather than a type the browser never sends.
 */
export const workloadSettingsSchema = z.object({
  /** Bounded at a week's worth of hours - nobody has more than 168 in a week. */
  weeklyCapacityHours: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, "Enter a whole number of hours")
    .refine((value) => {
      const hours = Number(value);
      return hours >= 1 && hours <= 168;
    }, "Enter between 1 and 168 hours"),
});

export type WorkloadSettingsInput = z.infer<typeof workloadSettingsSchema>;

/**
 * Early-warning thresholds (Phases.md Phase 9 — "configurable thresholds per
 * company"). Same string-all-the-way-to-the-column shape as
 * `workloadSettingsSchema`.
 */
export const alertSettingsSchema = z.object({
  overloadThresholdPercent: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, "Enter a whole percentage")
    .refine((value) => {
      const percent = Number(value);
      return percent >= 1 && percent <= 300;
    }, "Enter between 1 and 300"),
  stalledProjectDays: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, "Enter a whole number of days")
    .refine((value) => {
      const days = Number(value);
      return days >= 1 && days <= 365;
    }, "Enter between 1 and 365 days"),
  agingApprovalDays: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, "Enter a whole number of days")
    .refine((value) => {
      const days = Number(value);
      return days >= 1 && days <= 365;
    }, "Enter between 1 and 365 days"),
});

export type AlertSettingsInput = z.infer<typeof alertSettingsSchema>;
