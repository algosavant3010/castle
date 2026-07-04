import { publicClient } from './chain.js';
import { encodeFunctionData, formatEther } from 'viem';
import { CastleWalletABI } from '../abis/CastleWallet.js';

export interface SimulationResult {
  success: boolean;
  gasEstimate?: string;
  error?: string;
  revertReason?: string;
  wouldExceedCap?: boolean;
  wouldExceedBalance?: boolean;
}

export async function simulateAgentTransaction(params: {
  vaultAddress: `0x${string}`;
  agentAddress: `0x${string}`;
  target: `0x${string}`;
  value: bigint;
  calldata: `0x${string}`;
}): Promise<SimulationResult> {
  try {
    // 1. Check vault balance
    const vaultBalance = await publicClient.getBalance({ address: params.vaultAddress });
    if (params.value > vaultBalance) {
      return {
        success: false,
        wouldExceedBalance: true,
        revertReason: `Insufficient vault balance. Has ${formatEther(vaultBalance)} MON, needs ${formatEther(params.value)} MON.`,
      };
    }

    // 2. Check policy
    const policy = await publicClient.readContract({
      address: params.vaultAddress,
      abi: CastleWalletABI,
      functionName: 'getSessionPolicy',
      args: [params.agentAddress],
    }) as [bigint, bigint, bigint, bigint, `0x${string}`, `0x${string}`[], boolean];

    const [expiry, dailyCap, spentToday, , , , active] = policy;
    const now = BigInt(Math.floor(Date.now() / 1000));

    if (!active) return { success: false, revertReason: 'Session key is frozen.' };
    if (now >= expiry) return { success: false, revertReason: 'Session key has expired.' };
    if ((spentToday + params.value) > dailyCap) {
      return {
        success: false,
        wouldExceedCap: true,
        revertReason: `Daily cap exceeded. Spent: ${formatEther(spentToday)}, Cap: ${formatEther(dailyCap)}, This tx: ${formatEther(params.value)} MON.`,
      };
    }

    // 3. Simulate via eth_call
    const executeData = encodeFunctionData({
      abi: CastleWalletABI,
      functionName: 'executeAsAgent',
      args: [params.target, params.value, params.calldata],
    });

    await publicClient.call({
      account: params.agentAddress,
      to: params.vaultAddress,
      data: executeData,
    });

    // 4. Estimate gas
    let gasEstimate: string | undefined;
    try {
      const gas = await publicClient.estimateGas({
        account: params.agentAddress,
        to: params.vaultAddress,
        data: executeData,
      });
      gasEstimate = gas.toString();
    } catch {
      gasEstimate = undefined;
    }

    return { success: true, gasEstimate };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    let revertReason = message.slice(0, 300);
    if (message.includes('key not active')) revertReason = 'Session key is frozen';
    else if (message.includes('key expired')) revertReason = 'Session key has expired';
    else if (message.includes('daily cap exceeded')) revertReason = 'Daily cap would be exceeded';
    else if (message.includes('unauthorized target')) revertReason = 'Target contract not allowed';
    else if (message.includes('unauthorized function')) revertReason = 'Function selector not allowed';
    else if (message.includes('execution failed')) revertReason = 'Inner contract call would revert';
    return { success: false, error: message.slice(0, 300), revertReason };
  }
}
