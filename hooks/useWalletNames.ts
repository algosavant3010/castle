"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";

/**
 * Hook that fetches wallet (vault) names from Supabase via the API route.
 * Returns a name lookup map and a save function.
 */
export function useWalletNames() {
  const { address } = useAccount();
  const [names, setNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchNames = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/wallets/name?owner=${address}`);
      if (res.ok) {
        const data = await res.json();
        setNames(data);
      }
    } catch {
      // Silently fail — display will fall back to truncated address
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchNames();
  }, [fetchNames]);

  /** Get display name for a vault address, falls back to truncated address */
  const getDisplayName = useCallback(
    (walletAddress: string): string => {
      const name = names[walletAddress.toLowerCase()];
      if (name) return name;
      return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    },
    [names]
  );

  /** Save a wallet name to Supabase */
  const saveName = useCallback(
    async (walletAddress: string, name: string) => {
      if (!address) return;
      try {
        await fetch("/api/wallets/name", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: walletAddress,
            ownerAddress: address,
            name,
          }),
        });
        // Update local state immediately
        setNames((prev) => ({
          ...prev,
          [walletAddress.toLowerCase()]: name,
        }));
      } catch {
        // Silently fail
      }
    },
    [address]
  );

  return { names, isLoading, getDisplayName, saveName, refetch: fetchNames };
}
