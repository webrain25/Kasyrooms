import crypto from "crypto";

const DEFAULT_ITERATIONS = 120_000;
const DEFAULT_KEYLEN = 32;
const DEFAULT_DIGEST = "sha256";

export function hashPasswordPBKDF2(password: string, opts?: { iterations?: number }): string {
  const iterations = opts?.iterations ?? DEFAULT_ITERATIONS;
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.pbkdf2Sync(password, salt, iterations, DEFAULT_KEYLEN, DEFAULT_DIGEST).toString("hex");
  return `pbkdf2$${DEFAULT_DIGEST}$${iterations}$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;

  // Backward compatible: plain-text stored password
  if (!stored.startsWith("pbkdf2$")) {
    if (stored.length !== password.length) return false;
    return crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(password));
  }

  const parts = stored.split("$");
  // pbkdf2$<digest>$<iterations>$<salt>$<hash>
  if (parts.length !== 5) return false;
  const [, digest, iterationsStr, salt, expectedHex] = parts;

  const iterations = Number(iterationsStr);
  if (!Number.isFinite(iterations) || iterations < 10_000) return false;
  if (!salt || !expectedHex) return false;

  const actualHex = crypto.pbkdf2Sync(password, salt, iterations, DEFAULT_KEYLEN, digest as any).toString("hex");

  // timingSafeEqual requires equal length
  if (actualHex.length !== expectedHex.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actualHex), Buffer.from(expectedHex));
}
