import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Employee invite tokens (Architecture.md section 8).
 *
 * The plaintext token is shown once, in the invite link. Only its SHA-256 hash
 * is stored, so a database leak cannot be replayed to claim an account.
 *
 * SHA-256 is the right choice here (rather than bcrypt, which we use for
 * passwords): the token is 256 bits of cryptographic randomness, so it is not
 * guessable by brute force and needs no key-stretching.
 */
const TOKEN_BYTES = 32;
const INVITE_TTL_DAYS = 7;

export function generateInviteToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function inviteExpiryFrom(now: Date = new Date()): Date {
  return new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function isInviteExpired(
  expiresAt: Date | null,
  now: Date = new Date()
): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() <= now.getTime();
}

/** Constant-time comparison, so token checks cannot be attacked by timing. */
export function tokenHashMatches(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function buildInviteUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/invite/${token}`;
}
