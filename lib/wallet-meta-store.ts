/**
 * Wallet Metadata Store
 *
 * Client-side localStorage store for wallet names and settings.
 * On-chain contracts only store addresses/policies — human-friendly
 * metadata like names, labels, and creation context live here.
 */

export interface WalletMeta {
  /** Human-readable name (e.g., "Payment Bot", "TaskRunner") */
  name: string;
  /** Wallet preset type at creation time */
  preset: "marketplace" | "payments" | "custom";
  /** When this wallet was created (ISO string) */
  createdAt: string;
  /** The on-chain wallet (vault) address */
  walletAddress: string;
  /** Daily cap in MON (string for display) */
  dailyCap: string;
  /** Approval threshold in MON */
  approvalThreshold: string;
  /** Session duration in hours */
  expiryHours: string;
  /** Optional emoji/icon identifier */
  icon?: string;
}

// Keep the same localStorage key for backward compatibility
const STORAGE_KEY = "blitz_agent_meta";

function getAll(): Record<string, WalletMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, WalletMeta>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Save metadata for a wallet (keyed by session key address, lowercase) */
export function saveWalletMeta(address: string, meta: WalletMeta): void {
  const all = getAll();
  all[address.toLowerCase()] = meta;
  saveAll(all);
}

/** Get metadata for a specific wallet */
export function getWalletMeta(address: string): WalletMeta | null {
  const all = getAll();
  return all[address.toLowerCase()] || null;
}

/** Get all stored wallet metadata */
export function getAllWalletMeta(): Record<string, WalletMeta> {
  return getAll();
}

/** Remove metadata for a wallet */
export function removeWalletMeta(address: string): void {
  const all = getAll();
  delete all[address.toLowerCase()];
  saveAll(all);
}

/** Get a display name for a wallet — falls back to truncated address */
export function getWalletDisplayName(address: string): string {
  const meta = getWalletMeta(address);
  if (meta?.name) return meta.name;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Preset icons for quick visual identification */
export const PRESET_ICONS: Record<string, string> = {
  marketplace: "https://img.icons8.com/?id=8chNl15hy6jY&format=png&size=64",
  payments: "https://img.icons8.com/?id=equWoJQfZnGn&format=png&size=64",
  custom: "https://img.icons8.com/?id=73FgXcRF4HNx&format=png&size=64",
};

/** Default wallet icon */
export const DEFAULT_WALLET_ICON = "https://img.icons8.com/?id=6nsw3h9gk8M8&format=png&size=64";

/** Get icon URL for a wallet */
export function getWalletIcon(address: string): string {
  const meta = getWalletMeta(address);
  if (meta?.icon) return meta.icon;
  if (meta?.preset) return PRESET_ICONS[meta.preset] || DEFAULT_WALLET_ICON;
  return DEFAULT_WALLET_ICON;
}

