import { recoverMessageAddress, isAddress, getAddress } from 'viem';

/**
 * Owner signature authentication.
 *
 * The frontend has no server-side session; the "owner" is a wallet address.
 * To authorize an owner-scoped action we require the caller to sign a short,
 * structured message with their wallet. The server recovers the signer address
 * and checks it matches the claimed owner, that the purpose is correct, and that
 * the timestamp is fresh (limits replay). This proves control of the private key
 * behind the owner address without any password or Supabase Auth.
 */

const MAX_AGE_MS = 10 * 60 * 1000; // signature valid for 10 minutes
const CLOCK_SKEW_MS = 60 * 1000; // tolerate 1 minute of client clock skew

export interface OwnerAuthResult {
  ok: boolean;
  error?: string;
}

/**
 * Canonical auth message. MUST match the client builder in
 * lib/agent-api/owner-auth.ts byte-for-byte.
 */
export function buildAuthMessage(purpose: string, address: string, timestamp: number): string {
  return [
    'Castle Security',
    `Purpose: ${purpose}`,
    `Wallet: ${address.toLowerCase()}`,
    `Time: ${timestamp}`,
  ].join('\n');
}

export async function verifyOwnerAuth(params: {
  address: unknown;
  message: unknown;
  signature: unknown;
  purpose: string;
}): Promise<OwnerAuthResult> {
  const { address, message, signature, purpose } = params;

  if (typeof address !== 'string' || !isAddress(address)) {
    return { ok: false, error: 'Invalid or missing owner address.' };
  }
  if (typeof message !== 'string' || !message.startsWith('Castle Security')) {
    return { ok: false, error: 'Malformed authentication message.' };
  }
  if (typeof signature !== 'string' || !/^0x[0-9a-fA-F]+$/.test(signature)) {
    return { ok: false, error: 'Missing or malformed signature.' };
  }

  // Parse "Key: value" lines from the message.
  const fields: Record<string, string> = {};
  for (const line of message.split('\n')) {
    const idx = line.indexOf(':');
    if (idx > -1) fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }

  if (fields['Purpose'] !== purpose) {
    return { ok: false, error: 'Authentication purpose mismatch.' };
  }

  const msgWallet = fields['Wallet'];
  if (!msgWallet || !isAddress(msgWallet) || getAddress(msgWallet) !== getAddress(address)) {
    return { ok: false, error: 'Authentication wallet mismatch.' };
  }

  const ts = Number.parseInt(fields['Time'] || '', 10);
  if (!ts || Number.isNaN(ts)) {
    return { ok: false, error: 'Missing authentication timestamp.' };
  }
  const age = Date.now() - ts;
  if (age > MAX_AGE_MS || age < -CLOCK_SKEW_MS) {
    return { ok: false, error: 'Authentication expired. Please sign again.' };
  }

  try {
    const recovered = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    });
    if (getAddress(recovered) !== getAddress(address)) {
      return { ok: false, error: 'Signature does not match owner address.' };
    }
  } catch {
    return { ok: false, error: 'Signature verification failed.' };
  }

  return { ok: true };
}
