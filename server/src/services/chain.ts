import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { monadTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { config } from '../config.js';

export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(config.monad.rpc),
});

export function createAgentWalletClient(privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(config.monad.rpc),
  });
}

// ============================================================
// GAS SPONSOR — single wallet that pays gas for ALL agent txns
// ============================================================

const GAS_MIN_THRESHOLD = parseEther('0.01');  // Top up when below 0.01 MON
const GAS_TOP_UP_AMOUNT = parseEther('0.05');  // Refill to ~0.05 MON (enough for ~100 txns)

function getGasFunderKey(): `0x${string}` | null {
  const key = process.env.GAS_FUNDER_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  if (!key) return null;
  return key as `0x${string}`;
}

/**
 * Ensures an agent has enough gas to submit a transaction.
 * Called before every executeAsAgent call — checks the agent's balance
 * and tops it up from the gas sponsor if needed.
 *
 * This is the SINGLE point of gas sponsorship for all agents in Castle.
 */
export async function ensureAgentGas(agentAddress: `0x${string}`): Promise<void> {
  const funderKey = getGasFunderKey();
  if (!funderKey) {
    console.warn('[GasSponsor] No GAS_FUNDER_KEY configured — agents must self-fund gas.');
    return;
  }

  try {
    const balance = await publicClient.getBalance({ address: agentAddress });

    if (balance >= GAS_MIN_THRESHOLD) {
      return; // Agent has enough gas, no action needed
    }

    console.log(`[GasSponsor] ${agentAddress.slice(0, 10)}... balance ${formatEther(balance)} MON — topping up...`);

    const funderAccount = privateKeyToAccount(funderKey);
    const funderClient = createWalletClient({
      account: funderAccount,
      chain: monadTestnet,
      transport: http(config.monad.rpc),
    });

    const hash = await funderClient.sendTransaction({
      to: agentAddress,
      value: GAS_TOP_UP_AMOUNT,
      chain: monadTestnet,
    } as any);

    // Wait for the top-up to confirm before the agent transacts
    await publicClient.waitForTransactionReceipt({ hash });

    console.log(`[GasSponsor] Topped up ${agentAddress.slice(0, 10)}... with 0.05 MON — tx: ${hash}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[GasSponsor] Failed to top up ${agentAddress.slice(0, 10)}...:`, message);
    // Don't throw — let the agent attempt the tx anyway (might have just enough)
  }
}

/**
 * Initial gas drip for newly created agents.
 * Sends 0.1 MON so the agent can start transacting immediately.
 */
export async function fundAgentGas(agentAddress: `0x${string}`): Promise<{ hash: string } | { error: string }> {
  const funderKey = getGasFunderKey();
  if (!funderKey) {
    return { error: 'Gas funder not configured.' };
  }

  try {
    const funderAccount = privateKeyToAccount(funderKey);
    const funderClient = createWalletClient({
      account: funderAccount,
      chain: monadTestnet,
      transport: http(config.monad.rpc),
    });

    const hash = await funderClient.sendTransaction({
      to: agentAddress,
      value: parseEther('0.1'),
      chain: monadTestnet,
    } as any);

    console.log(`[GasSponsor] Initial fund 0.1 MON to ${agentAddress} — tx: ${hash}`);
    return { hash };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[GasSponsor] Initial fund failed for ${agentAddress}:`, message);
    return { error: message };
  }
}
