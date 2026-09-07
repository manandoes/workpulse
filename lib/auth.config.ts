import type { NextAuthConfig } from "next-auth";
import type { AccountType, AppRole } from "@/lib/permissions";

/**
 * Base auth configuration, deliberately free of any database access.
 *
 * `middleware.ts` builds a NextAuth instance from this alone so that route
 * protection can run on the edge, where Prisma cannot. The Credentials
 * providers that do hit the database live in `lib/auth.ts`.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    /**
     * Persist tenant and role onto the token at sign-in
     * (Phases.md Phase 2 — the session encodes companyId, role, accountType).
     */
    jwt({ token, user }) {
      if (user) {
        token.companyId = user.companyId;
        token.companySlug = user.companySlug;
        token.companyName = user.companyName;
        token.role = user.role;
        token.accountType = user.accountType;
      }
      return token;
    },

    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.companyId = token.companyId as string;
      session.user.companySlug = token.companySlug as string;
      session.user.companyName = token.companyName as string;
      session.user.role = token.role as AppRole;
      session.user.accountType = token.accountType as AccountType;
      return session;
    },
  },
} satisfies NextAuthConfig;
