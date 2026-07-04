"use client";

import { useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { CastleWalletABI } from "@/lib/chain/abis";
import { showTxOverlay, hideTxOverlay } from "@/components/app/transaction-overlay";

/**
 * Hook for withdrawing ALL funds from a vault back to the connected user.
 * Shows the global TX overlay while waiting for MetaMask signature.
 */
export function useWithdrawFunds(vaultAddress: `0x${string}` | undefined) {
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Show/hide overlay when pending
  useEffect(() => {
    if (isPending) showTxOverlay();
    else hideTxOverlay();
  }, [isPending]);

  const withdraw = () => {
    if (!userAddress || !vaultAddress) return;
    writeContract({
      address: vaultAddress,
      abi: CastleWalletABI,
      functionName: "emergencyWithdraw",
      args: [userAddress],
    });
  };

  return {
    withdraw,
    reset,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isLoading: isPending || isConfirming,
  };
}
