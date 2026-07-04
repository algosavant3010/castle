"use client";

import { useEffect, useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { BlitzWalletABI } from '@/lib/chain/abis';
import { showTxOverlay, hideTxOverlay } from "@/components/app/transaction-overlay";

export function useRegisterSession(walletAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isPending) showTxOverlay();
    else hideTxOverlay();
  }, [isPending]);

  const register = (
    key: `0x${string}`,
    expiry: bigint,
    dailyCap: bigint,
    allowedTarget: `0x${string}`,
    allowedFns: `0x${string}`[]
  ) => {
    writeContract({
      address: walletAddress,
      abi: BlitzWalletABI,
      functionName: 'registerSessionKey',
      args: [key, expiry, dailyCap, allowedTarget, allowedFns],
    });
  };

  const reset = useCallback(() => {
    resetWrite();
  }, [resetWrite]);

  return {
    register,
    reset,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
