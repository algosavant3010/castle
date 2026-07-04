/**
 * Owner authentication message builder (client side).
 *
 * MUST match the server verifier in server/src/services/signature.ts
 * (buildAuthMessage) byte-for-byte. The connected wallet signs this message and
 * the server recovers the signer to authorize owner-scoped actions.
 */
export function buildAuthMessage(purpose: string, address: string, timestamp: number): string {
  return [
    "Castle Security",
    `Purpose: ${purpose}`,
    `Wallet: ${address.toLowerCase()}`,
    `Time: ${timestamp}`,
  ].join("\n");
}

export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

/**
 * Cached owner auth payload. Owner signatures are valid server-side for 10
 * minutes; we cache slightly under that so the owner signs at most once per
 * window instead of on every owner-scoped request.
 */
export interface OwnerAuth {
  message: string;
  signature: string;
  ts: number;
}

const AUTH_TTL_MS = 9 * 60 * 1000; // 9 min (server allows 10)

function cacheKey(purpose: string, address: string): string {
  return `castle_owner_auth:${purpose}:${address.toLowerCase()}`;
}

export function getCachedOwnerAuth(purpose: string, address: string): OwnerAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(cacheKey(purpose, address));
    if (!raw) return null;
    const auth = JSON.parse(raw) as OwnerAuth;
    if (Date.now() - auth.ts > AUTH_TTL_MS) {
      sessionStorage.removeItem(cacheKey(purpose, address));
      return null;
    }
    return auth;
  } catch {
    return null;
  }
}

export function setCachedOwnerAuth(purpose: string, address: string, auth: OwnerAuth): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(cacheKey(purpose, address), JSON.stringify(auth));
  } catch {
    /* ignore quota / disabled storage */
  }
}
