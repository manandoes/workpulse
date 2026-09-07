import { handlers } from "@/lib/auth";

/**
 * NextAuth's own endpoints (sign-in callbacks, session, CSRF).
 *
 * The two credential providers registered in `lib/auth.ts` — `company-login`
 * and `employee-login` — are what keep the two identity tables apart; see
 * Architecture.md section 8.
 *
 * Static sibling routes such as /api/auth/company/register take precedence
 * over this catch-all in the Next.js router, so they are unaffected.
 */
export const { GET, POST } = handlers;
