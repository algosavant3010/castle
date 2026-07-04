"use client";

import { useState, useEffect } from "react";
import { useWallets, useWalletBalance } from "@/hooks/useWallets";
import { useActiveKeys } from "@/hooks/useSessions";
import { useFreeze } from "@/hooks/useFreeze";
import { useWithdrawFunds } from "@/hooks/useWithdrawFunds";
import { CONTRACTS } from "@/lib/chain/addresses";
import { MONAD_TESTNET_EXPLORER } from "@/lib/chain/config";
import { removeWalletMeta } from "@/lib/wallet-meta-store";
import { useWalletNames } from "@/hooks/useWalletNames";
import { getHiddenWallets, hideWallet } from "@/lib/hidden-wallets-store";
import { clearWalletActivity } from "@/lib/activity-store";
import { CastleLoader } from "@/components/app/castle-loader";
import { StatusIcon, type StatusVariant } from "@/components/app/status-icon";
import { CreateWalletInline } from "@/components/app/create-wallet-inline";
import { EmptyState } from "@/components/app/empty-state";
import Link from "next/link";
import BorderGlow from "@/components/reactbits/interactions/BorderGlow";
import { GLOW_PROPS } from "@/lib/ui";

function WalletCard({ walletAddress }: { walletAddress: `0x${string}` }) {
  const { data: balance } = useWalletBalance(walletAddress);
  const { data: activeKeys } = useActiveKeys(walletAddress);
  const { getDisplayName } = useWalletNames();
  const { freeze, isPending: isFreezing, isSuccess: freezeSuccess } = useFreeze(walletAddress);
  const { withdraw, isPending: isWithdrawPending, isConfirming: isWithdrawConfirming, isSuccess: withdrawSuccess, hash: withdrawHash } = useWithdrawFunds(walletAddress);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [deletePhase, setDeletePhase] = useState<"confirm" | "withdrawing" | "done">("confirm");

  const keys = (activeKeys as `0x${string}`[]) || [];
  const balanceNum = balance ? parseFloat(balance.formatted) : 0;
  const hasKeys = keys.length > 0;

  const walletName = getDisplayName(walletAddress);

  let walletStatus: "active" | "idle" | "frozen" = "idle";
  if (hasKeys) walletStatus = "active";
  if (freezeSuccess) walletStatus = "frozen";

  const handleDelete = () => {
    if (balanceNum > 0) {
      // Withdraw first — wallet will be hidden after withdrawal succeeds
      setDeletePhase("withdrawing");
      withdraw();
    } else {
      // No funds, safe to delete immediately
      if (hasKeys) freeze();
      keys.forEach((key) => removeWalletMeta(key));
      clearWalletActivity(walletAddress);
      hideWallet(walletAddress);
      setIsDeleted(true);
      setShowDeleteConfirm(false);
    }
  };

  // After withdrawal succeeds (from delete flow), finalize the delete
  useEffect(() => {
    if (withdrawSuccess && deletePhase === "withdrawing") {
      setDeletePhase("done");
    }
  }, [withdrawSuccess, deletePhase]);

  const finalizeDelete = () => {
    if (hasKeys) freeze();
    keys.forEach((key) => removeWalletMeta(key));
    clearWalletActivity(walletAddress);
    hideWallet(walletAddress);
    setIsDeleted(true);
    setShowDeleteConfirm(false);
  };

  if (isDeleted) {
    return null;
  }

  return (
    <BorderGlow {...GLOW_PROPS}>
      <div className="p-5">
        {/* Clickable header — goes to wallet detail */}
        <Link href={`/wallets/${walletAddress}`} className="block group">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/15 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text group-hover:text-accent transition-colors">{walletName}</h3>
                <p className="text-[11px] text-faint font-mono mt-0.5">{walletAddress}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-3">
              <StatusIcon
                variant={walletStatus === "active" ? "active" : walletStatus === "frozen" ? "frozen" as StatusVariant : "open" as StatusVariant}
                size={12}
                pulse={walletStatus === "active"}
              />
              <span className={`text-[11px] font-medium ${
                walletStatus === "active" ? "text-safe" :
                walletStatus === "frozen" ? "text-danger" : "text-faint"
              }`}>
                {walletStatus === "active" ? "Connected" : walletStatus === "frozen" ? "Frozen" : "Idle"}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 mb-4">
            <div>
              <p className="text-[10px] text-faint uppercase tracking-wider">Balance</p>
              <p className="font-mono text-lg font-semibold text-text mt-0.5">{balanceNum.toFixed(2)} <span className="text-xs text-muted font-normal">MON</span></p>
            </div>
            <div className="h-8 w-px bg-white/[0.06]" />
            <div>
              <p className="text-[10px] text-faint uppercase tracking-wider">Sessions</p>
              <p className="font-mono text-lg font-semibold text-text mt-0.5">{keys.length}</p>
            </div>
          </div>
        </Link>

        {/* Success states */}
        {withdrawSuccess && withdrawHash && (
          <div className="mb-3 rounded-lg border border-safe/20 bg-safe/5 p-2.5">
            <p className="text-xs text-safe">Funds withdrawn!</p>
            <a href={`${MONAD_TESTNET_EXPLORER}/tx/${withdrawHash}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent">View tx →</a>
          </div>
        )}
        {freezeSuccess && (
          <div className="mb-3 rounded-lg border border-warning/20 bg-warning/5 p-2.5">
            <p className="text-xs text-warning">All sessions revoked.</p>
          </div>
        )}

        {/* Delete confirm */}
        {showDeleteConfirm && (
          <div className="mb-3 rounded-lg border border-danger/20 bg-danger/5 p-3">
            {deletePhase === "confirm" && (
              <>
                <p className="text-xs text-danger font-medium">Delete this wallet?</p>
                <p className="text-[11px] text-muted mt-1">
                  {hasKeys ? "Active sessions will be revoked. " : ""}
                  {balanceNum > 0 ? (
                    <>Your <strong className="text-text">{balanceNum.toFixed(4)} MON</strong> will be withdrawn to your wallet first.</>
                  ) : "No balance to withdraw."}
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleDelete} disabled={isFreezing || isWithdrawPending || isWithdrawConfirming} className="btn text-xs bg-danger/10 border-danger/30 text-danger hover:bg-danger/20 flex-1">
                    {balanceNum > 0 ? "Withdraw & Delete" : "Delete"}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-ghost text-xs flex-1">Cancel</button>
                </div>
              </>
            )}
            {deletePhase === "withdrawing" && (
              <>
                <p className="text-xs text-text font-medium">Withdrawing funds...</p>
                <p className="text-[11px] text-muted mt-1">
                  {isWithdrawPending ? "Confirm in your wallet..." : isWithdrawConfirming ? "Processing withdrawal..." : "Waiting..."}
                </p>
              </>
            )}
            {deletePhase === "done" && (
              <>
                <p className="text-xs text-safe font-medium">Funds withdrawn!</p>
                {withdrawHash && (
                  <a href={`${MONAD_TESTNET_EXPLORER}/tx/${withdrawHash}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent mt-1 block">View tx &#x2192;</a>
                )}
                <button onClick={finalizeDelete} className="btn text-xs bg-danger/10 border-danger/30 text-danger hover:bg-danger/20 w-full mt-3">
                  Remove from Dashboard
                </button>
              </>
            )}
          </div>
        )}

        {/* Withdraw confirm */}
        {showWithdrawConfirm && !showDeleteConfirm && (
          <div className="mb-3 rounded-lg border border-accent/20 bg-accent/5 p-3">
            <p className="text-xs text-text font-medium">Withdraw funds</p>
            <p className="text-[11px] text-muted mt-1">
              Transfer <strong className="text-text">{balanceNum.toFixed(4)} MON</strong> to your connected wallet.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => withdraw()}
                disabled={isWithdrawPending || isWithdrawConfirming}
                className="btn btn-primary text-xs flex-1"
              >
                {isWithdrawPending ? "Confirm in MetaMask..." : isWithdrawConfirming ? "Processing..." : `Withdraw ${balanceNum.toFixed(2)} MON`}
              </button>
              <button onClick={() => setShowWithdrawConfirm(false)} className="btn btn-ghost text-xs flex-1">Cancel</button>
            </div>
          </div>
        )}

        {/* Actions bar */}
        <div className="flex items-center gap-2 pt-3 border-t border-white/[0.04]">
          {hasKeys && walletStatus === "active" && (
            <button
              onClick={() => freeze()}
              disabled={isFreezing}
              className="btn text-xs border-danger/20 text-danger hover:bg-danger/10 px-3 flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              {isFreezing ? "..." : "Freeze"}
            </button>
          )}

          {balanceNum > 0 && !showDeleteConfirm && (
            <button
              onClick={() => setShowWithdrawConfirm(true)}
              className="btn text-xs border-accent/20 text-accent hover:bg-accent/10 px-3 flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              Withdraw
            </button>
          )}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn text-xs border-white/[0.06] text-faint hover:text-danger hover:border-danger/20 hover:bg-danger/5 px-2.5"
            title="Delete wallet"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          </button>

          {/* Spacer + Explorer */}
          <a
            href={`${MONAD_TESTNET_EXPLORER}/address/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn text-xs border-white/[0.06] text-faint hover:text-accent hover:border-accent/20 px-2.5 ml-auto"
            title="View on explorer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        </div>
      </div>
    </BorderGlow>
  );
}

export default function WalletsPage() {
  const { wallets, isLoading } = useWallets();
  const [hiddenWallets] = useState<string[]>(() => getHiddenWallets());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const contractsDeployed = CONTRACTS.factory !== "0x0000000000000000000000000000000000000000";

  // Filter out hidden (soft-deleted) wallets, tracked locally per device.
  const visibleWallets = wallets.filter(
    v => !hiddenWallets.some(h => h.toLowerCase() === v.toLowerCase())
  );

  // Show inline create wallet form
  if (showCreateForm) {
    return <CreateWalletInline onClose={() => setShowCreateForm(false)} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text">AI Wallets</h1>
          <p className="mt-0.5 sm:mt-1 text-[12px] sm:text-sm text-muted">Manage your AI wallets and sessions</p>
        </div>
        <button onClick={() => setShowCreateForm(true)} className="btn btn-primary text-[12px] sm:text-sm shrink-0">
          + New
        </button>
      </div>

      {!contractsDeployed && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
          <p className="text-sm text-warning">Contracts not deployed to Monad testnet yet.</p>
        </div>
      )}

      {isLoading && <CastleLoader />}

      {/* Wallet cards */}
      {visibleWallets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleWallets.map((wallet) => (
            <WalletCard key={wallet} walletAddress={wallet} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && visibleWallets.length === 0 && contractsDeployed && (
        <EmptyState
          title="No AI wallets yet"
          description="Deploy your first AI wallet and connect it to any AI chatbot."
          action={
            <button onClick={() => setShowCreateForm(true)} className="btn btn-primary inline-flex">
              Deploy First Wallet
            </button>
          }
        />
      )}
    </div>
  );
}
