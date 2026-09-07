import { describe, expect, it } from "vitest";
import {
  buildInviteUrl,
  generateInviteToken,
  hashInviteToken,
  inviteExpiryFrom,
  isInviteExpired,
  tokenHashMatches,
} from "@/lib/invites";

describe("generateInviteToken", () => {
  it("produces a URL-safe token", () => {
    expect(generateInviteToken()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("does not repeat", () => {
    const tokens = new Set(
      Array.from({ length: 200 }, () => generateInviteToken())
    );
    expect(tokens.size).toBe(200);
  });
});

describe("hashInviteToken", () => {
  it("is deterministic, so a link can be looked up by its hash", () => {
    const token = generateInviteToken();
    expect(hashInviteToken(token)).toBe(hashInviteToken(token));
  });

  it("differs for different tokens", () => {
    expect(hashInviteToken("token-a")).not.toBe(hashInviteToken("token-b"));
  });

  /** The stored value must not reveal the token it came from. */
  it("never returns the plaintext token", () => {
    const token = generateInviteToken();
    const hash = hashInviteToken(token);
    expect(hash).not.toContain(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("invite expiry", () => {
  it("expires seven days out", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    expect(inviteExpiryFrom(now).toISOString()).toBe(
      "2026-01-08T00:00:00.000Z"
    );
  });

  it("treats a future expiry as valid and a past one as expired", () => {
    const now = new Date("2026-01-05T00:00:00.000Z");
    expect(isInviteExpired(new Date("2026-01-06T00:00:00.000Z"), now)).toBe(
      false
    );
    expect(isInviteExpired(new Date("2026-01-04T00:00:00.000Z"), now)).toBe(
      true
    );
  });

  it("treats the exact expiry moment as expired", () => {
    const at = new Date("2026-01-05T00:00:00.000Z");
    expect(isInviteExpired(at, at)).toBe(true);
  });

  /** A missing expiry must fail closed, never grant access. */
  it("treats a missing expiry as expired", () => {
    expect(isInviteExpired(null)).toBe(true);
  });
});

describe("tokenHashMatches", () => {
  it("matches identical hashes and rejects different ones", () => {
    const hash = hashInviteToken("token-a");
    expect(tokenHashMatches(hash, hash)).toBe(true);
    expect(tokenHashMatches(hash, hashInviteToken("token-b"))).toBe(false);
  });

  it("rejects differing lengths without throwing", () => {
    expect(tokenHashMatches("short", "much-longer-value")).toBe(false);
  });
});

describe("buildInviteUrl", () => {
  it("builds the link the employee opens", () => {
    expect(buildInviteUrl("http://localhost:3000", "abc")).toBe(
      "http://localhost:3000/invite/abc"
    );
  });

  it("does not double the slash when the base URL has a trailing one", () => {
    expect(buildInviteUrl("https://app.example.com/", "abc")).toBe(
      "https://app.example.com/invite/abc"
    );
  });
});
