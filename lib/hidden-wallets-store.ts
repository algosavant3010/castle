/**
 * Local storage utilities for managing wallet visibility.
 * - "imported" wallets: external wallet addresses the user manually added
 * - "hidden" wallets: wallets the user wants to hide from the UI (soft delete)
 */

// Keep same localStorage keys for backward compatibility
const IMPORTED_KEY = "castle_imported_vaults";
const HIDDEN_KEY = "castle_hidden_vaults";

function getStoredArray(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredArray(key: string, arr: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(arr));
}

// --- Imported wallets ---

export function getImportedWallets(): `0x${string}`[] {
  return getStoredArray(IMPORTED_KEY) as `0x${string}`[];
}

export function importWallet(address: `0x${string}`) {
  const current = getStoredArray(IMPORTED_KEY);
  const lower = address.toLowerCase();
  if (!current.some((a) => a.toLowerCase() === lower)) {
    setStoredArray(IMPORTED_KEY, [...current, address]);
  }
  unhideWallet(address);
}

export function removeImportedWallet(address: `0x${string}`) {
  const current = getStoredArray(IMPORTED_KEY);
  setStoredArray(
    IMPORTED_KEY,
    current.filter((a) => a.toLowerCase() !== address.toLowerCase())
  );
}

// --- Hidden wallets ---

export function getHiddenWallets(): string[] {
  return getStoredArray(HIDDEN_KEY);
}

export function hideWallet(address: `0x${string}`) {
  const current = getStoredArray(HIDDEN_KEY);
  const lower = address.toLowerCase();
  if (!current.some((a) => a.toLowerCase() === lower)) {
    setStoredArray(HIDDEN_KEY, [...current, address]);
  }
  removeImportedWallet(address);
}

export function unhideWallet(address: `0x${string}`) {
  const current = getStoredArray(HIDDEN_KEY);
  setStoredArray(
    HIDDEN_KEY,
    current.filter((a) => a.toLowerCase() !== address.toLowerCase())
  );
}

export function isWalletHidden(address: `0x${string}`): boolean {
  const hidden = getStoredArray(HIDDEN_KEY);
  return hidden.some((a) => a.toLowerCase() === address.toLowerCase());
}
