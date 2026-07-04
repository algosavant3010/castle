import { NextResponse } from "next/server";

/** Max JSON body size: 100KB */
const MAX_BODY_SIZE = 100_000;

/** Max memo length: 256 chars */
export const MAX_MEMO_LENGTH = 256;

/** Max ABI array length: 50 items */
export const MAX_ABI_LENGTH = 50;

/** Max MON amount per single transaction: 10000 MON */
export const MAX_AMOUNT = 10_000;

/**
 * Validate request body size isn't too large.
 * Call this BEFORE parsing JSON.
 */
export async function validateBodySize(req: Request): Promise<NextResponse | null> {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: `Request body too large. Maximum: ${MAX_BODY_SIZE} bytes.` },
      { status: 413 }
    );
  }
  return null;
}

/**
 * Validate a MON amount string.
 * Returns an error message or null if valid.
 */
export function validateAmount(amount: string): string | null {
  const num = parseFloat(amount);
  if (isNaN(num)) return "Amount must be a valid number.";
  if (num <= 0) return "Amount must be greater than 0.";
  if (num > MAX_AMOUNT) return `Amount exceeds maximum (${MAX_AMOUNT} MON).`;
  if (amount.includes("e") || amount.includes("E")) return "Scientific notation not allowed.";
  // Check decimal places (max 18 for ETH/MON)
  const parts = amount.split(".");
  if (parts[1] && parts[1].length > 18) return "Too many decimal places (max 18).";
  return null;
}

/**
 * Validate an Ethereum value string (used in call route).
 * Returns an error message or null if valid.
 */
export function validateValue(value: string | undefined): string | null {
  if (!value || value === "0") return null;
  return validateAmount(value);
}

/**
 * Validate a memo string.
 */
export function validateMemo(memo: string | undefined): string | null {
  if (!memo) return null;
  if (typeof memo !== "string") return "Memo must be a string.";
  if (memo.length > MAX_MEMO_LENGTH) return `Memo too long (max ${MAX_MEMO_LENGTH} chars).`;
  return null;
}

/**
 * Validate an ABI array.
 */
export function validateAbi(abi: unknown[]): string | null {
  if (abi.length > MAX_ABI_LENGTH) return `ABI too large (max ${MAX_ABI_LENGTH} entries).`;
  // Basic structure check: each entry should be an object
  for (let i = 0; i < abi.length; i++) {
    if (typeof abi[i] !== "object" || abi[i] === null) {
      return `ABI entry at index ${i} must be an object.`;
    }
  }
  return null;
}

/**
 * Validate function name (prevent injection-like patterns).
 */
export function validateFunctionName(name: string): string | null {
  if (name.length > 256) return "Function name too long.";
  // Allow standard Solidity function names: alphanumeric, underscores, parentheses for overloads
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    return "Invalid function name format.";
  }
  return null;
}
