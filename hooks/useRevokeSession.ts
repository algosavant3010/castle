"use client";

import { useEffect, useCallback, useRef } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { BlitzWalletABI } from '@/lib/chain/abis';
import { showTxOverlay, hideTxOverlay } from "@/components/app/transaction-overlay";
import { clearSessionActivity } from "@/lib/activity-store";
import { removeWalletMeta } from "@/lib/wallet-meta-store";

export function useRevokeSession(walletAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const pendingKeyRef = useRef<`0x${string}` | null>(null);

  useEffect(() => {
    if (isPending) showTxOverlay();
    else hideTxOverlay();
  }, [isPending]);

  // On successful revoke confirmation, clear activity and metadata
  useEffect(() => {
    if (isSuccess && pendingKeyRef.current) {
      clearSessionActivity(pendingKeyRef.current);
      removeWalletMeta(pendingKeyRef.current);
      pendingKeyRef.current = null;
    }
  }, [isSuccess]);

  const revoke = (key: `0x${string}`) => {
    pendingKeyRef.current = key;
    writeContract({
      address: walletAddress,
      abi: BlitzWalletABI,
      functionName: 'revokeSessionKey',
      args: [key],
    });
  };

  const reset = useCallback(() => {
    pendingKeyRef.current = null;
    resetWrite();
  }, [resetWrite]);

  return {
    revoke,
    reset,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
