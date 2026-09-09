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
     * Route-handler tests (Phases.md Phase 12) hit the real `lib/db.ts`
     * Prisma client/connection pool against the same pooled Postgres
     * (Supabase's Supavisor, session mode, capped at 15 clients — see
     * `.env`). `isolate` defaults to true, which resets the module registry
     * per test file: that defeats `lib/db.ts`'s `globalForPrisma` singleton,
     * so every file opened a brand-new `pg.Pool(max: 5)` that was never
     * disposed. With `maxWorkers` files running concurrently that thrashed
     * far past the pooler's 15-client cap (`EMAXCONNSESSION`). Disabling
     * isolate lets the singleton persist for the life of a worker, so total
     * connections are bounded by `maxWorkers * adapter.max` instead of
     * `total test files * adapter.max`; capping workers at 2 keeps that
     * bound (2 * 5 = 10) safely under the pooler's limit.
     */
    maxWorkers: 2,
    isolate: false,
  },
});
