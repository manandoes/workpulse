import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Prisma client singleton.
 *
 * Prisma 7 connects through a driver adapter rather than a bundled query
 * engine, so the Postgres adapter is constructed from DATABASE_URL here.
 *
 * Next.js dev mode hot-reloads modules on every change, which would otherwise
 * open a new connection pool per reload and exhaust Postgres connections. In
 * development we cache the client on `globalThis`; in production each server
 * instance creates exactly one.
 *
 * On Vercel, each request can land on a different serverless instance, so
 * the effective connection count is `concurrent instances * max` — not just
 * `max`. DATABASE_URL must point at a pooler built for that concurrency
 * (Supabase's Supavisor in *transaction* mode, port 6543, with
 * `?pgbouncer=true` so Prisma skips named prepared statements transaction
 * mode doesn't support) rather than session mode (port 5432, capped at a
 * low total client count), which exhausts fast under real serverless load.
 * See .env.example. Because the pooler already multiplexes connections
 * server-side, each instance only needs a small local pool.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and configure it."
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max: 3,
      idleTimeoutMillis: 10_000,
    }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
