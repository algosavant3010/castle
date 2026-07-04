"use client";

import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { CastleWalletABI, CastleWalletFactoryABI } from "@/lib/chain/abis";
import { CONTRACTS } from "@/lib/chain/addresses";
import { formatEther } from "viem";

export type BatchSweepStatus = "idle" | "loading" | "executing" | "success" | "error";

export interface BatchSweepResult {
  vault: `0x${string}`;
  amount: string; // formatted ETH/MON value
  hash?: `0x${string}`;
  error?: string;
}

/**
 * Emergency sweep all vaults — calls emergencyWithdraw(owner) on every vault
 * that has a non-zero balance. Funds go to the connected wallet.
 */
export function useBatchSweep() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [status, setStatus] = useState<BatchSweepStatus>("idle");
  const [results, setResults] = useState<BatchSweepResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const reset = useCallback(() => {
    setStatus("idle");
    setResults([]);
    setProgress({ current: 0, total: 0 });
  }, []);

  const execute = useCallback(async () => {
    if (!address || !publicClient || !walletClient) return;

    setStatus("loading");
    setResults([]);

    try {
      // 1. Fetch all user vaults
      const vaults = (await publicClient.readContract({
        address: CONTRACTS.factory,
        abi: CastleWalletFactoryABI,
        functionName: "getWallets",
        args: [address],
      })) as `0x${string}`[];

      if (!vaults || vaults.length === 0) {
        setStatus("success");
        setResults([]);
        return;
      }

      // 2. Check balances and filter vaults with funds
      const vaultsWithFunds: { address: `0x${string}`; balance: bigint }[] = [];

      for (const vault of vaults) {
        try {
          const balance = await publicClient.getBalance({ address: vault });
          if (balance > BigInt(0)) {
            vaultsWithFunds.push({ address: vault, balance });
          }
        } catch {
          // Skip vaults we can't query
        }
      }

      if (vaultsWithFunds.length === 0) {
        setStatus("success");
        setResults([]);
        return;
      }

      setProgress({ current: 0, total: vaultsWithFunds.length });
      setStatus("executing");

      // 3. Sweep each vault sequentially
      const batchResults: BatchSweepResult[] = [];

      for (let i = 0; i < vaultsWithFunds.length; i++) {
        const vault = vaultsWithFunds[i];
        setProgress({ current: i + 1, total: vaultsWithFunds.length });

        try {
          const hash = await walletClient.writeContract({
            address: vault.address,
            abi: CastleWalletABI,
            functionName: "emergencyWithdraw",
            args: [address],
          });

          // Wait for confirmation
          await publicClient.waitForTransactionReceipt({ hash });

          batchResults.push({
            vault: vault.address,
            amount: formatEther(vault.balance),
            hash,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message.slice(0, 100) : "Unknown error";
          batchResults.push({
            vault: vault.address,
            amount: formatEther(vault.balance),
            error: message.includes("User rejected") ? "Rejected in wallet" : message,
          });
          // If user rejected, stop the batch
          if (err instanceof Error && err.message.includes("User rejected")) {
            break;
          }
        }
      }

      setResults(batchResults);
      const hasErrors = batchResults.some((r) => r.error);
      setStatus(hasErrors ? "error" : "success");
    } catch (err) {
      const message = err instanceof Error ? err.message.slice(0, 100) : "Unknown error";
      setResults([{ vault: "0x0" as `0x${string}`, amount: "0", error: message }]);
      setStatus("error");
    }
  }, [address, publicClient, walletClient]);

  const totalSwept = results
    .filter((r) => !r.error)
    .reduce((sum, r) => sum + parseFloat(r.amount), 0);

  return {
    execute,
    reset,
    status,
    results,
    progress,
    totalSwept,
  };
}
