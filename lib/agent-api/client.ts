import { createPublicClient, createWalletClient, http } from "viem";
import { monadTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const MONAD_RPC = process.env.NEXT_PUBLIC_MONAD_RPC || "https://testnet-rpc.monad.xyz";

/**
 * Shared public client for reading on-chain state.
 * Reused across all API routes.
 */
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(MONAD_RPC),
});

/**
 * Create a wallet client for a specific session key.
 * Used for signing and broadcasting transactions.
 */
export function createAgentWalletClient(privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(MONAD_RPC),
  });
}
