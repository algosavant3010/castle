/**
 * Owner authentication message builder (client side).
 *
 * MUST match the server verifier in server/src/services/signature.ts
 * (buildAuthMessage) byte-for-byte. The connected wallet signs this message and
 * the server recovers the signer to authorize owner-scoped actions.
 */
export function buildAuthMessage(purpose: string, address: string, timestamp: number): string {
  return [
    "Blitz Security",
    `Purpose: ${purpose}`,
    `Wallet: ${address.toLowerCase()}`,
    `Time: ${timestamp}`,
  ].join("\n");
}

export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";
