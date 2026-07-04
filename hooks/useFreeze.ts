"use client";

import { useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { BlitzWalletABI } from '@/lib/chain/abis';
import { showTxOverlay, hideTxOverlay } from "@/components/app/transaction-overlay";
import { clearWalletActivity } from "@/lib/activity-store";

export function useFreeze(vaultAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isPending) showTxOverlay();
    else hideTxOverlay();
  }, [isPending]);

  // On successful freeze, clear all activity for this wallet's sessions
  useEffect(() => {
    if (isSuccess) {
      clearWalletActivity(vaultAddress);
    }
  }, [isSuccess, vaultAddress]);

  const freeze = () => {
    writeContract({
      address: vaultAddress,
      abi: BlitzWalletABI,
      functionName: 'freezeAgent',
    });
  };

  return {
    freeze,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
