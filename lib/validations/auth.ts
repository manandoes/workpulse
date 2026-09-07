import { z } from "zod";

/**
 * Validation schemas for every auth entry point (Rules.md section 4 — request
 * bodies are validated before anything touches the database).
 *
 * The two login schemas are deliberately different shapes. A company login
 * identifies a person by work email; an employee login identifies a person
 * *within a named company* by employee code or company email. Keeping them
 * separate is what stops one form's credentials being replayed against the
 * other table (Architecture.md section 8).
 */

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password is too long");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(255);

const companySlug = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your company ID")
  .max(40)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Company ID may only contain lowercase letters, numbers and hyphens"
  );

/** Company registration — creates a tenant plus its first Owner account. */
export const registerCompanySchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "Enter your company name")
    .max(100, "Company name is too long"),
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(100, "Name is too long"),
  workEmail: email,
  password,
});

/** Company login — work email, with an optional slug to disambiguate. */
export const companyLoginSchema = z.object({
  workEmail: email,
  password: z.string().min(1, "Enter your password"),
  companySlug: companySlug.optional().or(z.literal("")),
});

/**
 * Employee login — company ID plus employee code *or* company email.
 * A single `identifier` field accepts either, so employees do not have to know
 * which one their company uses.
 */
export const employeeLoginSchema = z.object({
  companySlug,
  identifier: z
    .string()
    .trim()
    .min(1, "Enter your employee ID or work email")
    .max(255),
  password: z.string().min(1, "Enter your password"),
});

/**
 * Setting a password from an invite link.
 *
 * Shared by both invite flows — the employee one and the company-account one —
 * because the payload is identical. The two are still handled by separate
 * endpoints that each touch only their own table (Architecture.md section 8).
 */
export const acceptInviteSchema = z.object({
  token: z.string().trim().min(1, "Invite token is missing"),
  password,
});

export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;
export type CompanyLoginInput = z.infer<typeof companyLoginSchema>;
export type EmployeeLoginInput = z.infer<typeof employeeLoginSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
