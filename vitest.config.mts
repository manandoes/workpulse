import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

/**
 * Route-handler tests (Phases.md Phase 12) construct the real `lib/db.ts`
 * Prisma client, which reads `DATABASE_URL` from `process.env` — Next's own
 * CLI loads `.env` for `next dev`/`build`, but a standalone `vitest run`
 * otherwise never does. Vite (which vitest is built on) already bundles a
 * `.env` loader for exactly this; reusing it here needs no new dependency.
 */
const env = loadEnv("test", process.cwd(), "");
for (const [key, value] of Object.entries(env)) {
  process.env[key] ??= value;
}

export default defineConfig({
  resolve: {
    // Mirror the `@/*` path alias from tsconfig.json.
    alias: { "@": path.resolve(import.meta.dirname, ".") },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**", "lib/generated/**"],
    /**
     * Route-handler tests (Phases.md Phase 12) each construct their own
     * `lib/db.ts` Prisma client/connection pool against the same pooled
     * Postgres (Supabase's pgbouncer in this repo's `.env`). One worker per
     * test file, unbounded, briefly opened enough simultaneous pools to time
     * some queries out under the full suite. Capping worker count trades a
     * little wall-clock time for not overwhelming a shared, pooled database.
     */
    maxWorkers: 4,
  },
});
