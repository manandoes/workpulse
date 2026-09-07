import bcrypt from "bcryptjs";

/**
 * Password hashing (Architecture.md section 8).
 *
 * Cost 12 is a deliberate balance: high enough that a leaked hash is expensive
 * to attack, low enough to keep sign-in responsive.
 */
const BCRYPT_COST = 12;

export function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, BCRYPT_COST);
}

export function verifyPassword(
  plainText: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainText, passwordHash);
}

/**
 * Burn roughly the same CPU as a real password check.
 *
 * Without this, an unknown email returns noticeably faster than a known one
 * with a wrong password, which lets an attacker enumerate valid accounts by
 * timing alone. Call this on the "no such user" path so both outcomes cost the
 * same.
 */
const DUMMY_HASH =
  "$2b$12$Ku0Qs5Sx0RQKZ4tGkOx9OO7lQq2sZ0jVYm5vJ4nCq9y6mQpKQ6Vb2";

export async function equalizeTiming(): Promise<void> {
  await bcrypt.compare("timing-equalizer", DUMMY_HASH);
}
