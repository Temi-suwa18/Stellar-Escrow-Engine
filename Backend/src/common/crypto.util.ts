import { createHash, randomBytes } from 'node:crypto';

/** Generates a URL-safe random token (e.g. for magic links, invitations, refresh tokens). */
export function generateOpaqueToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('base64url');
}

/**
 * One-way hash for tokens we need to look up by exact match but never want
 * recoverable from the database (session/refresh tokens, magic link tokens,
 * invitation tokens, API keys). SHA-256 — not bcrypt/argon2 — because these
 * are high-entropy random tokens, not low-entropy user passwords; a fast
 * hash is fine and lets us index/query on it directly.
 */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
