import { z } from "zod";
import { INVITABLE_ROLES } from "@/lib/permissions";

/**
 * Validation for employee management (Rules.md section 4 — every request body
 * is validated before anything touches the database).
 *
 * Login and registration schemas stay in `validations/auth.ts`; this module
 * owns the employee record itself.
 */

/**
 * Optional free text. HTML forms submit "" for an untouched field, so the empty
 * string is accepted here and normalised to `null` by the route rather than
 * being rejected as invalid.
 */
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

/** `<input type="date">` submits `YYYY-MM-DD` or "". */
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

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(255);

const fullName = z
  .string()
  .trim()
  .min(2, "Enter the employee's full name")
  .max(100);

const employeeCode = z
  .string()
  .trim()
  .min(1, "Enter an employee ID")
  .max(40)
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "Employee ID may only contain letters, numbers, dots, hyphens and underscores"
  );

export const EMPLOYMENT_TYPES = [
  "FullTime",
  "PartTime",
  "Contract",
  "Intern",
] as const;

/**
 * Professional profile (PRD.md section 6.2).
 *
 * `departmentName` is a name rather than an id: the form lets HR type a new
 * department, and the route finds or creates it inside their own company.
 * `manager` is the encoded picker value parsed by `parseManagerRef`.
 */
const professionalFields = {
  departmentName: optionalText(100),
  jobRole: optionalText(100),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional().or(z.literal("")),
  startDate: optionalDate,
  manager: optionalText(80),
};

/**
 * Personal profile (PRD.md section 6.2).
 *
 * Rules.md section 3: these are only ever read or written by Owner/Admin/HR or
 * the employee's own manager — see `canViewPersonalDetails`.
 */
const personalFields = {
  personalEmail: optionalEmail,
  phone: optionalText(30),
  dateOfBirth: optionalDate,
  location: optionalText(100),
  address: optionalText(300),
  emergencyContactName: optionalText(100),
  emergencyContactPhone: optionalText(30),
};

/** Adding an employee: identity plus the professional basics. */
export const createEmployeeSchema = z.object({
  fullName,
  companyEmail: email,
  employeeCode,
  ...professionalFields,
});

/** Editing an employee: everything, including personal details. */
export const updateEmployeeSchema = z.object({
  fullName,
  companyEmail: email,
  employeeCode,
  ...professionalFields,
  ...personalFields,
});

/**
 * Status changes are their own request, separate from profile edits, so a
 * suspension is never a side effect of saving a form.
 */
export const employeeStatusSchema = z.object({
  status: z.enum(["Active", "Suspended"]),
});

/** Inviting an Admin / Manager / HR login (Architecture.md section 4). */
export const inviteCompanyAccountSchema = z.object({
  fullName: z.string().trim().min(2, "Enter their full name").max(100),
  workEmail: email,
  role: z.enum(INVITABLE_ROLES),
});

/**
 * Directory search parameters. Unknown or malformed values are dropped rather
 * than erroring, because these come from a URL a user can freely edit.
 */
export const directoryFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  departmentId: z.string().trim().max(40).optional().catch(undefined),
  status: z
    .enum(["Invited", "Active", "Suspended"])
    .optional()
    .catch(undefined),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeStatusInput = z.infer<typeof employeeStatusSchema>;
export type InviteCompanyAccountInput = z.infer<
  typeof inviteCompanyAccountSchema
>;
export type DirectoryFiltersInput = z.infer<typeof directoryFiltersSchema>;
