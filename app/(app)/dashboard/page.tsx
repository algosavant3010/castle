"use client";

import { useState } from "react";
import { useWallets, useWalletBalance } from "@/hooks/useWallets";
import { useTaskCount } from "@/hooks/useMarketplace";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { CONTRACTS } from "@/lib/chain/addresses";
import { getHiddenWallets } from "@/lib/hidden-wallets-store";
import { CreateWalletInline } from "@/components/app/create-wallet-inline";
import Link from "next/link";
import BorderGlow from "@/components/reactbits/interactions/BorderGlow";
import { StatusIcon } from "@/components/app/status-icon";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState, BoltMark } from "@/components/app/empty-state";
import { Skeleton } from "@/components/app/skeleton";
import { GLOW_PROPS } from "@/lib/ui";

/** Sums balance across all wallets. Each wallet gets its own useBalance hook via a child component. */
function WalletBalanceItem({ address, onBalance }: { address: `0x${string}`; onBalance: (val: number) => void }) {
  const { data: balance } = useWalletBalance(address);
  const val = balance ? parseFloat(balance.formatted) : 0;
  // Report balance up via callback (runs on every render, but lightweight)
  if (balance) onBalance(val);
  return null;
}

function TotalBalanceDisplay({ wallets }: { wallets: `0x${string}`[] }) {
  const [balances, setBalances] = useState<Record<string, number>>({});

  const total = Object.values(balances).reduce((sum, b) => sum + b, 0);

  return (
    <>
      {wallets.map((w) => (
        <WalletBalanceItem
          key={w}
          address={w}
          onBalance={(val) => {
            setBalances((prev) => {
              if (prev[w] === val) return prev;
              return { ...prev, [w]: val };
            });
          }}
        />
      ))}
      {Object.keys(balances).length === 0 ? <Skeleton width="4rem" /> : total.toFixed(2)}
    </>
  );
}

export default function DashboardPage() {
  const { wallets: allWallets } = useWallets();
  const { data: taskCount } = useTaskCount();
  const { events } = useActivityFeed();
  const [hiddenWallets] = useState<string[]>(() => getHiddenWallets());
  const [showCreateForm, setShowCreateForm] = useState(false);

  const wallets = allWallets.filter(
    v => !hiddenWallets.some(h => h.toLowerCase() === v.toLowerCase())
  );

  const contractsDeployed = CONTRACTS.factory !== "0x0000000000000000000000000000000000000000";
  const hasWallets = wallets.length > 0;

  // ─── Empty State ───
  if (!hasWallets) {
    if (showCreateForm) {
      return <CreateWalletInline onClose={() => setShowCreateForm(false)} />;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="w-full max-w-md">
          <EmptyState
            icon={<BoltMark size={32} />}
            title="Welcome to Castle"
            description="Deploy your first AI Wallet to start delegating on-chain actions with time-boxed session keys and spend limits."
            action={
              !contractsDeployed ? (
                <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                  <p className="text-sm text-warning">Contracts not deployed to Monad testnet yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <button onClick={() => setShowCreateForm(true)} className="btn btn-primary w-full py-3 text-base inline-flex justify-center">
                    Deploy AI Wallet
                  </button>
                  <p className="text-xs text-faint">Minimal gas on Monad Testnet.</p>
                </div>
              )
            }
          />
        </div>
      </div>
    );
  }

  // ─── Data State ───
  return (
    <div className="space-y-6">
      {showCreateForm ? (
        <CreateWalletInline onClose={() => setShowCreateForm(false)} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text">Dashboard</h1>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
            <StatCard
              label="Total Balance"
              value={<TotalBalanceDisplay wallets={wallets} />}
              unit="MON"
              href="/wallets"
            />
            <StatCard label="AI Wallets" value={wallets.length} unit="deployed" href="/wallets" />
            <StatCard
              label="Open Tasks"
              value={taskCount ? Number(taskCount) : 0}
              unit="marketplace"
              href="/marketplace"
              className="col-span-2 lg:col-span-1"
            />
          </div>

          {/* Quick actions */}
          <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
            <button onClick={() => setShowCreateForm(true)} className="block text-left">
              <BorderGlow {...GLOW_PROPS}>
                <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-5 cursor-pointer transition-transform duration-150 active:scale-[0.98]">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] sm:text-sm font-medium text-text">New AI Wallet</p>
                    <p className="text-[11px] sm:text-xs text-muted truncate">Deploy and create sessions for any AI</p>
                  </div>
                </div>
              </BorderGlow>
            </button>

            <Link href="/marketplace" className="block">
              <BorderGlow {...GLOW_PROPS}>
                <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:p-5 cursor-pointer transition-transform duration-150 active:scale-[0.98]">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                      <path d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM3 9l2.45-4.9A2 2 0 017.24 3h9.52a2 2 0 011.79 1.1L21 9" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] sm:text-sm font-medium text-text">Marketplace</p>
                    <p className="text-[11px] sm:text-xs text-muted truncate">Post tasks or browse open work</p>
                  </div>
                </div>
              </BorderGlow>
            </Link>
          </div>

          {/* Recent activity */}
          <BorderGlow {...GLOW_PROPS}>
            <div className="p-4 sm:p-6">
              <div className="mb-3 sm:mb-4 flex items-center justify-between">
                <h2 className="text-[13px] sm:text-sm font-medium text-text">Recent activity</h2>
                <Link href="/activity" className="flex items-center gap-2 group">
                  <StatusIcon variant="live" size={10} pulse />
                  <span className="text-[10px] sm:text-[11px] text-muted/60 group-hover:text-accent transition-colors">View all</span>
                </Link>
              </div>
              {events.length === 0 ? (
                <p className="text-[13px] sm:text-sm text-muted py-4 sm:py-6 text-center">
                  No activity yet. Events appear here as sessions transact on-chain.
                </p>
              ) : (
                <div className="space-y-1">
                  {events.slice(0, 6).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 sm:gap-3 rounded-xl px-2.5 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-sm transition-all duration-200 hover:bg-white/[0.03]"
                    >
                      <StatusIcon variant="active" size={8} />
                      <span className="text-muted truncate flex-1">{event.action}</span>
                      {event.amount && <span className="font-mono text-[10px] sm:text-xs text-accent shrink-0">{event.amount}</span>}
                      <span className="ml-auto font-mono text-[10px] sm:text-[11px] text-faint shrink-0">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BorderGlow>
        </>
      )}
    </div>
  );
}
