import { z } from "zod";
import { CLIENT_STATUSES, PROJECT_STATUSES } from "@/lib/projects";

/**
 * Validation for clients and projects (Rules.md section 4 — every request body
 * is validated before anything touches the database).
 */

/**
 * Optional free text. HTML forms submit "" for an untouched field, so the empty
 * string is accepted here and normalised to `null` by the write resolver rather
 * than being rejected as invalid.
 */
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
  .optional()
  .or(z.literal(""));

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(255)
  .optional()
  .or(z.literal(""));

/**
 * Money as typed: digits with at most two decimal places, kept as a string all
 * the way to the Decimal column so it is never rounded through a float.
 * Negative values are rejected — a project's value and its cost are both
 * quantities, and a negative one is a typo rather than a refund.
 */
const optionalAmount = z
  .string()
  .trim()
  .regex(
    /^\d{1,12}(\.\d{1,2})?$/,
    "Enter an amount in numbers, for example 150000"
  )
  .optional()
  .or(z.literal(""));

const name = (label: string) => z.string().trim().min(2, label).max(120);

/**
 * A short project code such as "NW-WEB". Constrained like the employee code so
 * it stays usable in a URL, a filename and a search box.
 */
const code = z
  .string()
  .trim()
  .max(20)
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "Project code may only contain letters, numbers, dots, hyphens and underscores"
  )
  .optional()
  .or(z.literal(""));

export const createClientSchema = z.object({
  name: name("Enter the client's name"),
  contactName: optionalText(100),
  contactEmail: optionalEmail,
  contactPhone: optionalText(30),
  notes: optionalText(1000),
});

export const updateClientSchema = createClientSchema;

/**
 * Archiving is its own request, separate from the profile edit, so it is never
 * a side effect of saving a form.
 */
export const clientStatusSchema = z.object({
  status: z.enum(CLIENT_STATUSES),
});

export const createProjectSchema = z.object({
  name: name("Enter the project's name"),
  clientId: z.string().trim().min(1, "Choose a client"),
  code,
  description: optionalText(2000),
  status: z.enum(PROJECT_STATUSES).optional(),
  startDate: optionalDate,
  dueDate: optionalDate,
  value: optionalAmount,
  estimatedCost: optionalAmount,
  /** Empty means "no lead"; otherwise a CompanyAccount id. */
  lead: optionalText(40),
});

export const updateProjectSchema = createProjectSchema;

/** Adding or removing one team member (Phases.md Phase 4 — assign a team). */
export const projectMemberSchema = z.object({
  employeeId: z.string().trim().min(1, "Choose an employee"),
});

/**
 * List filters. Unknown or malformed values are dropped rather than erroring,
 * because these come from a URL a user can freely edit.
 */
export const projectFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  clientId: z.string().trim().max(40).optional().catch(undefined),
  status: z.enum(PROJECT_STATUSES).optional().catch(undefined),
});

export const clientFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(CLIENT_STATUSES).optional().catch(undefined),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientStatusInput = z.infer<typeof clientStatusSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectMemberInput = z.infer<typeof projectMemberSchema>;
export type ProjectFiltersInput = z.infer<typeof projectFiltersSchema>;
export type ClientFiltersInput = z.infer<typeof clientFiltersSchema>;
