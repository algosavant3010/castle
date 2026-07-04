import { privateKeyToAccount } from "viem/accounts";
import { NextRequest, NextResponse } from "next/server";

export interface AgentCredentials {
  vaultAddress: `0x${string}`;
  privateKey: `0x${string}`;
  agentAddress: `0x${string}`;
}

/**
 * Extract agent credentials from the Authorization header.
 * Token format: Bearer <vaultAddress>:<privateKey>
 *
 * Returns parsed credentials or a NextResponse error.
 */
export function extractCredentials(
  req: NextRequest
): AgentCredentials | NextResponse {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing Authorization header. Use: Bearer <vaultAddress>:<privateKey>" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7).trim();
  const separatorIndex = token.indexOf(":", 2); // skip "0x" prefix

  if (separatorIndex === -1) {
    return NextResponse.json(
      { error: "Invalid token format. Expected: <vaultAddress>:<privateKey>" },
      { status: 401 }
    );
  }

  const vaultAddress = token.slice(0, separatorIndex) as `0x${string}`;
  const privateKey = token.slice(separatorIndex + 1) as `0x${string}`;

  // Validate format
  if (!/^0x[a-fA-F0-9]{40}$/.test(vaultAddress)) {
    return NextResponse.json(
      { error: "Invalid vault address in token" },
      { status: 401 }
    );
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    return NextResponse.json(
      { error: "Invalid private key in token" },
      { status: 401 }
    );
  }

  try {
    const account = privateKeyToAccount(privateKey);
    return {
      vaultAddress,
      privateKey,
      agentAddress: account.address,
    };
  } catch {
    return NextResponse.json(
      { error: "Failed to derive account from private key" },
      { status: 401 }
    );
  }
}

/**
 * Check if the result of extractCredentials is an error response.
 */
export function isAuthError(
  result: AgentCredentials | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
