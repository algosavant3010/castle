/**
 * Activity Store
 *
 * Persists per-session activity logs in localStorage.
 * Activity is keyed by session key address (lowercase).
 *
 * Lifecycle:
 * - Manual revoke → activity for that session is deleted
 * - Natural expiry → activity remains (historical record)
 */

export interface SessionActivity {
  id: string;
  sessionKey: string;
  walletAddress: string;
  target: string;
  value: string;
  selector: string;
  txHash: string;
  timestamp: number;
  /** "revoked" entries are never stored — they get deleted. "expired" entries persist. */
  status: "confirmed";
}

const STORAGE_KEY = "castle_session_activity";

function getAll(): Record<string, SessionActivity[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, SessionActivity[]>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Add an activity entry for a session key */
export function addSessionActivity(sessionKey: string, activity: SessionActivity): void {
  const all = getAll();
  const key = sessionKey.toLowerCase();
  if (!all[key]) all[key] = [];
  // Deduplicate by id
  if (all[key].some((a) => a.id === activity.id)) return;
  all[key].unshift(activity);
  // Cap at 100 entries per session
  if (all[key].length > 100) all[key] = all[key].slice(0, 100);
  saveAll(all);
}

/** Get all activity for a specific session key */
export function getSessionActivity(sessionKey: string): SessionActivity[] {
  const all = getAll();
  return all[sessionKey.toLowerCase()] || [];
}

/** Get all activity across all sessions (for the activity page) */
export function getAllSessionActivity(): SessionActivity[] {
  const all = getAll();
  const combined: SessionActivity[] = [];
  for (const entries of Object.values(all)) {
    combined.push(...entries);
  }
  // Sort by timestamp descending
  combined.sort((a, b) => b.timestamp - a.timestamp);
  return combined.slice(0, 200);
}

/** Get activity for a specific wallet (all sessions on that wallet) */
export function getWalletActivity(walletAddress: string): SessionActivity[] {
  const all = getAll();
  const lower = walletAddress.toLowerCase();
  const combined: SessionActivity[] = [];
  for (const entries of Object.values(all)) {
    combined.push(...entries.filter((a) => a.walletAddress.toLowerCase() === lower));
  }
  combined.sort((a, b) => b.timestamp - a.timestamp);
  return combined;
}

/**
 * Clear all activity for a session key.
 * Called on manual revoke — permanently removes the logs.
 */
export function clearSessionActivity(sessionKey: string): void {
  const all = getAll();
  delete all[sessionKey.toLowerCase()];
  saveAll(all);
}

/**
 * Clear all activity for all sessions on a specific wallet.
 * Called when the wallet is deleted / all sessions frozen.
 */
export function clearWalletActivity(walletAddress: string): void {
  const all = getAll();
  const lower = walletAddress.toLowerCase();
  for (const [key, entries] of Object.entries(all)) {
    if (entries.some((a) => a.walletAddress.toLowerCase() === lower)) {
      delete all[key];
    }
  }
  saveAll(all);
}

/** Get all tracked session keys that have activity */
export function getActiveSessionKeys(): string[] {
  return Object.keys(getAll());
}
