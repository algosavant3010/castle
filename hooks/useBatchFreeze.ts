"use client";

import { useState, useCallback } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { BlitzWalletABI, BlitzWalletFactoryABI } from "@/lib/chain/abis";
import { CONTRACTS } from "@/lib/chain/addresses";

export type BatchFreezeStatus = "idle" | "loading" | "executing" | "success" | "error";

export interface BatchFreezeResult {
  vault: `0x${string}`;
  keysRevoked: number;
  hash?: `0x${string}`;
  error?: string;
}

/**
 * Batch-revoke all session keys across every vault the user owns.
 * Calls freezeAgent() on each vault sequentially — one tx per vault.
 */
export function useBatchFreeze() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [status, setStatus] = useState<BatchFreezeStatus>("idle");
  const [results, setResults] = useState<BatchFreezeResult[]>([]);
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
        abi: BlitzWalletFactoryABI,
        functionName: "getWallets",
        args: [address],
      })) as `0x${string}`[];

      if (!vaults || vaults.length === 0) {
        setStatus("success");
        setResults([]);
        return;
      }

      // 2. Filter vaults that have active keys
      const vaultsWithKeys: { address: `0x${string}`; keyCount: number }[] = [];

      for (const vault of vaults) {
        try {
          const keys = (await publicClient.readContract({
            address: vault,
            abi: BlitzWalletABI,
            functionName: "getActiveKeys",
          })) as `0x${string}`[];

          if (keys && keys.length > 0) {
            vaultsWithKeys.push({ address: vault, keyCount: keys.length });
          }
        } catch {
          // Skip vaults we can't read
        }
      }

      if (vaultsWithKeys.length === 0) {
        setStatus("success");
        setResults([]);
        return;
      }

      setProgress({ current: 0, total: vaultsWithKeys.length });
      setStatus("executing");

      // 3. Freeze each vault sequentially
      const batchResults: BatchFreezeResult[] = [];

      for (let i = 0; i < vaultsWithKeys.length; i++) {
        const vault = vaultsWithKeys[i];
        setProgress({ current: i + 1, total: vaultsWithKeys.length });

        try {
          const hash = await walletClient.writeContract({
            address: vault.address,
            abi: BlitzWalletABI,
            functionName: "freezeAgent",
          });

          // Wait for confirmation
          await publicClient.waitForTransactionReceipt({ hash });

          batchResults.push({
            vault: vault.address,
            keysRevoked: vault.keyCount,
            hash,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message.slice(0, 100) : "Unknown error";
          batchResults.push({
            vault: vault.address,
            keysRevoked: 0,
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
      setResults([{ vault: "0x0" as `0x${string}`, keysRevoked: 0, error: message }]);
      setStatus("error");
    }
  }, [address, publicClient, walletClient]);

  const totalRevoked = results.reduce((sum, r) => sum + r.keysRevoked, 0);

  return {
    execute,
    reset,
    status,
    results,
    progress,
    totalRevoked,
  };
}
