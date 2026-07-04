"use client";

import { useWatchContractEvent, usePublicClient } from 'wagmi';
import { useState, useCallback, useEffect, useRef } from 'react';
import { CastleEscrowABI, CastleWalletABI } from '@/lib/chain/abis';
import { CONTRACTS } from '@/lib/chain/addresses';
import { formatEther, type Log } from 'viem';
import { useWallets } from '@/hooks/useWallets';
import { addSessionActivity, getAllSessionActivity, type SessionActivity } from '@/lib/activity-store';

export interface ActivityEvent {
  id: string;
  type: 'wallet' | 'escrow';
  eventName: string;
  agent?: string;
  action: string;
  amount?: string;
  txHash?: `0x${string}`;
  timestamp: number;
  status: 'confirmed';
}

export function useActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [sessionLogs, setSessionLogs] = useState<SessionActivity[]>([]);
  const [paused, setPaused] = useState(false);
  const [buffered, setBuffered] = useState<ActivityEvent[]>([]);

  const { wallets } = useWallets();
  const publicClient = usePublicClient();
  const contractsDeployed = CONTRACTS.escrow !== '0x0000000000000000000000000000000000000000';

  // Track active watchers to clean up properly
  const watchersRef = useRef<(() => void)[]>([]);

  // Load persisted session activity on mount
  useEffect(() => {
    setSessionLogs(getAllSessionActivity());
  }, []);

  // Watch BlitzEscrow events (global marketplace activity)
  useWatchContractEvent({
    address: CONTRACTS.escrow,
    abi: CastleEscrowABI,
    onLogs: (logs) => {
      const newEvents: ActivityEvent[] = logs.map((log) => ({
        id: `${log.transactionHash}-${log.logIndex}`,
        type: 'escrow' as const,
        eventName: (log as unknown as { eventName?: string }).eventName || 'Unknown',
        action: formatEscrowEvent(log),
        amount: getAmountFromLog(log),
        txHash: log.transactionHash ?? undefined,
        timestamp: Date.now(),
        status: 'confirmed' as const,
      }));

      if (paused) {
        setBuffered(prev => [...newEvents, ...prev]);
      } else {
        setEvents(prev => [...newEvents, ...prev].slice(0, 50));
      }
    },
    enabled: contractsDeployed,
  });

  // Watch AgentExecution events on user's wallets using useEffect + viem
  // (NOT hooks in a loop — that violates React rules)
  useEffect(() => {
    if (!publicClient || wallets.length === 0) return;

    // Clean up previous watchers
    watchersRef.current.forEach((unwatch) => unwatch());
    watchersRef.current = [];

    for (const walletAddress of wallets) {
      const unwatch = publicClient.watchContractEvent({
        address: walletAddress,
        abi: CastleWalletABI,
        eventName: 'AgentExecution',
        onLogs: (logs) => {
          for (const log of logs) {
            const args = (log as unknown as { args?: { key?: `0x${string}`; target?: `0x${string}`; value?: bigint; selector?: `0x${string}` } }).args;
            if (!args?.key) continue;

            const activity: SessionActivity = {
              id: `${log.transactionHash}-${log.logIndex}`,
              sessionKey: args.key,
              walletAddress,
              target: args.target || '',
              value: args.value ? formatEther(args.value) : '0',
              selector: args.selector || '0x',
              txHash: log.transactionHash || '',
              timestamp: Date.now(),
              status: 'confirmed',
            };

            addSessionActivity(args.key, activity);
            setSessionLogs(getAllSessionActivity());

            // Also add to the live event feed
            const liveEvent: ActivityEvent = {
              id: activity.id,
              type: 'wallet',
              eventName: 'AgentExecution',
              agent: args.key,
              action: `Agent ${args.key.slice(0, 8)}... → ${(args.target || '').slice(0, 8)}...`,
              amount: activity.value !== '0' ? `${activity.value} MON` : undefined,
              txHash: log.transactionHash ?? undefined,
              timestamp: Date.now(),
              status: 'confirmed',
            };

            setEvents(prev => [liveEvent, ...prev].slice(0, 50));
          }
        },
      });
      watchersRef.current.push(unwatch);
    }

    return () => {
      watchersRef.current.forEach((unwatch) => unwatch());
      watchersRef.current = [];
    };
  }, [publicClient, wallets]);

  const resume = useCallback(() => {
    setEvents(prev => [...buffered, ...prev].slice(0, 50));
    setBuffered([]);
    setPaused(false);
  }, [buffered]);

  /** Refresh persisted session logs (call after revoke/clear) */
  const refreshSessionLogs = useCallback(() => {
    setSessionLogs(getAllSessionActivity());
  }, []);

  return { events, sessionLogs, paused, setPaused, resume, bufferedCount: buffered.length, refreshSessionLogs };
}

function getAmountFromLog(log: Log): string | undefined {
  const args = (log as unknown as { args?: Record<string, unknown> }).args;
  if (!args) return undefined;
  if ('reward' in args && typeof args.reward === 'bigint') {
    return formatEther(args.reward) + ' MON';
  }
  if ('amount' in args && typeof args.amount === 'bigint') {
    return formatEther(args.amount) + ' MON';
  }
  return undefined;
}

function formatEscrowEvent(log: Log): string {
  const typed = log as unknown as { eventName?: string; args?: Record<string, unknown> };
  const args = typed.args || {};
  switch (typed.eventName) {
    case 'TaskCreated': return `Create task #${args.taskId}`;
    case 'TaskAccepted': return `Accept task #${args.taskId}`;
    case 'WorkSubmitted': return `Submit work #${args.taskId}`;
    case 'FundsReleased': return `Release funds #${args.taskId}`;
    case 'TaskDisputed': return `Dispute task #${args.taskId}`;
    case 'TaskCancelled': return `Cancel task #${args.taskId}`;
    default: return typed.eventName || 'Unknown event';
  }
}
