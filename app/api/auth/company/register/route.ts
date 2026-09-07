import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiError, serverError, validationError } from "@/lib/api";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/passwords";
import { uniqueSlug } from "@/lib/slug";
import { registerCompanySchema } from "@/lib/validations/auth";

/**
 * POST /api/auth/company/register
 *
 * Creates a new tenant plus its first CompanyAccount, which always holds the
 * Owner role (Phases.md Phase 2). This is the only self-service registration
 * path in the product — employees can never register themselves
 * (Architecture.md section 8).
 */
export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return apiError("Expected a JSON body.", 400, "invalid_json");
  }

  const parsed = registerCompanySchema.safeParse(payload);
  if (!parsed.success) return validationError(parsed.error);

  const { companyName, fullName, workEmail, password } = parsed.data;

  try {
    const slug = await uniqueSlug(companyName, async (candidate) => {
      const existing = await db.company.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      return existing !== null;
    });

    const passwordHash = await hashPassword(password);

    /**
     * The company and its Owner are created together: a tenant with no way to
     * sign in would be unusable, so neither should exist without the other.
     */
    const company = await db.company.create({
      data: {
        name: companyName,
        slug,
        accounts: {
          create: {
            fullName,
            workEmail,
            passwordHash,
            role: "Owner",
          },
        },
      },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json(
      {
        company: { name: company.name, slug: company.slug },
        // The client signs in with these straight after registering.
        workEmail,
      },
      { status: 201 }
    );
  } catch (cause) {
    // A duplicate work email inside the same brand-new company is impossible,
    // so a unique-constraint failure here means the slug raced another signup.
    if (
      cause &&
      typeof cause === "object" &&
      "code" in cause &&
      cause.code === "P2002"
    ) {
      return apiError(
        "That company name was just taken. Please try again.",
        409,
        "slug_taken"
      );
    }

    return serverError({ route: "POST /api/auth/company/register" }, cause);
  }
}
