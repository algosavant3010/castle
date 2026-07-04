"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import {
  SERVER_URL,
  buildAuthMessage,
  getCachedOwnerAuth,
  setCachedOwnerAuth,
} from "@/lib/owner-auth";

const AUTH_PURPOSE = "view-activity";

export interface ServerActivityItem {
  agentAddress: string;
  agentName: string | null;
  vaultAddress: string;
  target: string;
  functionName: string;
  valueMon: string;
  memo: string | null;
  txHash: string | null;
  executed: boolean;
  success: boolean | null;
  blockNumber: number | null;
  createdAt: string;
}

/**
 * Fetches the connected owner's transaction history from the Castle server
 * (the same `transactions` table that drives Telegram alerts). This backfills
 * the activity feed with events that happened while the app was closed, which
 * the live on-chain watchers cannot see.
 *
 * Requires an owner signature. The signature is cached per session (~9 min) so
 * the owner is not prompted on every visit. If no cached signature exists,
 * `needsAuth` is true and the UI can call `sync()` to prompt once.
 */
export function useServerActivity() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [transactions, setTransactions] = useState<ServerActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const inFlight = useRef(false);

  const fetchWithAuth = useCallback(
    async (auth: { message: string; signature: string }) => {
      if (!address) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${SERVER_URL}/api/agents/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerAddress: address,
            authMessage: auth.message,
            authSignature: auth.signature,
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || `Request failed (${res.status})`);
        }
        const data = (await res.json()) as { transactions: ServerActivityItem[] };
        setTransactions(data.transactions || []);
        setNeedsAuth(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load activity.");
      } finally {
        setIsLoading(false);
      }
    },
    [address]
  );

  // Auto-load silently when a cached signature is available.
  useEffect(() => {
    if (!address) {
      setTransactions([]);
      setNeedsAuth(false);
      return;
    }
    const cached = getCachedOwnerAuth(AUTH_PURPOSE, address);
    if (cached) {
      fetchWithAuth(cached);
    } else {
      setNeedsAuth(true);
    }
  }, [address, fetchWithAuth]);

  /** Prompt the owner to sign once, cache it, then fetch. */
  const sync = useCallback(async () => {
    if (!address || inFlight.current) return;
    inFlight.current = true;
    setError(null);
    try {
      const ts = Date.now();
      const message = buildAuthMessage(AUTH_PURPOSE, address, ts);
      const signature = await signMessageAsync({ message });
      const auth = { message, signature, ts };
      setCachedOwnerAuth(AUTH_PURPOSE, address, auth);
      await fetchWithAuth(auth);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signature rejected.");
    } finally {
      inFlight.current = false;
    }
  }, [address, signMessageAsync, fetchWithAuth]);

  return { transactions, isLoading, error, needsAuth, sync };
}
