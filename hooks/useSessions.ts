"use client";

import { useReadContract } from 'wagmi';
import { BlitzWalletABI } from '@/lib/chain/abis';

export type SessionStatus = 'active' | 'expiring' | 'frozen' | 'expired';

export function useActiveKeys(walletAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: walletAddress,
    abi: BlitzWalletABI,
    functionName: 'getActiveKeys',
    query: { enabled: !!walletAddress },
  });
}

export function useSessionPolicy(walletAddress: `0x${string}` | undefined, keyAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: walletAddress,
    abi: BlitzWalletABI,
    functionName: 'getSessionPolicy',
    args: keyAddress ? [keyAddress] : undefined,
    query: { enabled: !!walletAddress && !!keyAddress },
  });
}

export function computeSessionStatus(expiry: bigint, active: boolean, spentToday: bigint, dailyCap: bigint): SessionStatus {
  if (!active) return 'frozen';
  if (expiry === BigInt(0)) return 'expired';
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (now >= expiry) return 'expired';
  if (expiry - now < BigInt(3600)) return 'expiring';
  return 'active';
}

