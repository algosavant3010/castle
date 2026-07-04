"use client";

import { useEffect, useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CastleWalletFactoryABI } from '@/lib/chain/abis';
import { CONTRACTS } from '@/lib/chain/addresses';
import { showTxOverlay, hideTxOverlay } from "@/components/app/transaction-overlay";

export function useDeployWallet() {
  const { writeContract, data: hash, isPending, error, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isPending) showTxOverlay();
    else hideTxOverlay();
  }, [isPending]);

  const deploy = () => {
    writeContract({
      address: CONTRACTS.factory,
      abi: CastleWalletFactoryABI,
      functionName: 'deployWallet',
    });
  };

  const reset = useCallback(() => {
    resetWrite();
  }, [resetWrite]);

  return {
    deploy,
    reset,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
