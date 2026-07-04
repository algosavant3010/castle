"use client";

import { useReadContract, useBalance, useAccount } from 'wagmi';
import { CastleWalletFactoryABI } from '@/lib/chain/abis';
import { CONTRACTS } from '@/lib/chain/addresses';

export function useWallets() {
  const { address } = useAccount();

  const { data: walletAddresses, isLoading, refetch } = useReadContract({
    address: CONTRACTS.factory,
    abi: CastleWalletFactoryABI,
    functionName: 'getWallets',
    args: address ? [address] : undefined,
    query: { enabled: !!address && CONTRACTS.factory !== '0x0000000000000000000000000000000000000000' },
  });

  return {
    wallets: (walletAddresses as `0x${string}`[]) || [],
    isLoading,
    refetch,
  };
}

export function useWalletBalance(walletAddress: `0x${string}` | undefined) {
  return useBalance({
    address: walletAddress,
    query: { enabled: !!walletAddress },
  });
}
