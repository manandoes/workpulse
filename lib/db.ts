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
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
