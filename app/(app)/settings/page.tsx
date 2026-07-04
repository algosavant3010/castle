"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useDisconnect, useBalance, useSignMessage } from "wagmi";
import { useBatchFreeze } from "@/hooks/useBatchFreeze";
import { useBatchSweep } from "@/hooks/useBatchSweep";
import { useWallets, useWalletBalance } from "@/hooks/useWallets";
import { getHiddenWallets } from "@/lib/hidden-wallets-store";
import { MONAD_TESTNET_EXPLORER } from "@/lib/chain/config";
import { buildAuthMessage } from "@/lib/owner-auth";
import BorderGlow from "@/components/reactbits/interactions/BorderGlow";

import { GLOW_PROPS } from "@/lib/ui";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const TABS = ["Account", "Alerts", "Danger zone"];

const TELEGRAM_STORAGE_KEY = "blitz_telegram_chat_id";
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

function AlertsTab() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [chatId, setChatId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [savedChatId, setSavedChatId] = useState<string | null>(null);
  const [step, setStep] = useState<"input" | "otp">("input");
  const [status, setStatus] = useState<"idle" | "verifying" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Cache the owner signature for the 10-minute server window so linking does
  // not prompt a wallet signature on every call.
  const authRef = useRef<{ message: string; signature: string; ts: number } | null>(null);
  async function getAuth() {
    if (!address) throw new Error("Connect your wallet first.");
    const cached = authRef.current;
    if (cached && Date.now() - cached.ts < 9 * 60 * 1000) return cached;
    const ts = Date.now();
    const authMessage = buildAuthMessage("link-telegram", address, ts);
    const signature = await signMessageAsync({ message: authMessage });
    const auth = { message: authMessage, signature, ts };
    authRef.current = auth;
    return auth;
  }

  useEffect(() => {
    const stored = localStorage.getItem(TELEGRAM_STORAGE_KEY);
    if (stored) {
      setSavedChatId(stored);
      setChatId(stored);
    }
  }, []);

  // Step 1: Send OTP to the chat ID
  async function handleSendCode() {
    if (!chatId.trim()) return;
    setStatus("verifying");
    setMessage("");

    try {
      const auth = await getAuth();
      const res = await fetch(`${SERVER_URL}/api/telegram/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: chatId.trim(), ownerAddress: address, authMessage: auth.message, authSignature: auth.signature }),
      });
      const data = await res.json();

      if (data.codeSent) {
        setStep("otp");
        setStatus("idle");
        setMessage("");
      } else {
        setStatus("error");
        setMessage(data.error || "Could not send code");
      }
    } catch {
      setStatus("error");
      setMessage("Network error");
    }
  }

  // Step 2: Confirm OTP
  async function handleConfirmCode() {
    if (!otpCode.trim()) return;
    setStatus("verifying");
    setMessage("");

    try {
      const auth = await getAuth();
      const res = await fetch(`${SERVER_URL}/api/telegram/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: chatId.trim(), code: otpCode.trim(), ownerAddress: address, authMessage: auth.message, authSignature: auth.signature }),
      });
      const data = await res.json();

      if (data.verified) {
        localStorage.setItem(TELEGRAM_STORAGE_KEY, chatId.trim());
        setSavedChatId(chatId.trim());
        setStep("input");
        setOtpCode("");
        setStatus("success");
        setMessage("Verified and connected!");
      } else {
        setStatus("error");
        setMessage(data.error || "Verification failed");
      }
    } catch {
      setStatus("error");
      setMessage("Network error");
    }
  }

  async function handleTestNotification() {
    if (!savedChatId) return;
    setStatus("sending");
    setMessage("");

    try {
      // Send a verification code as a test (proves the bot can reach the chat)
      const auth = await getAuth();
      const res = await fetch(`${SERVER_URL}/api/telegram/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: savedChatId,
          ownerAddress: address,
          authMessage: auth.message,
          authSignature: auth.signature,
        }),
      });
      const data = await res.json();

      if (data.success || data.codeSent) {
        setStatus("success");
        setMessage("Test sent! Check Telegram.");
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to send");
      }
    } catch {
      setStatus("error");
      setMessage("Network error");
    }
  }

  function handleDisconnect() {
    localStorage.removeItem(TELEGRAM_STORAGE_KEY);
    setSavedChatId(null);
    setChatId("");
    setOtpCode("");
    setStep("input");
    setStatus("idle");
    setMessage("");
  }

  return (
    <div className="space-y-4">
      {/* Telegram Channel */}
      <BorderGlow {...GLOW_PROPS}>
        <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#229ED9]/15">
            <svg className="h-4 w-4 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-text">Telegram</h3>
            <p className="text-xs text-faint">Receive push notifications on your phone</p>
          </div>
          {savedChatId && (
            <span className="chip bg-safe/10 text-safe ml-auto">Connected</span>
          )}
        </div>

        {!savedChatId ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
              <p className="text-xs text-muted mb-3">
                1. Open Telegram and search for <span className="font-mono text-accent">@BlitzConnectBot</span><br />
                2. Send <span className="font-mono text-accent">/start</span> to the bot<br />
                3. Send <span className="font-mono text-accent">/id</span> to get your Chat ID<br />
                4. Paste it below and verify ownership
              </p>

              {step === "input" && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    placeholder="Your Telegram Chat ID"
                    className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-text placeholder:text-faint/50 outline-none focus:border-accent/40 transition-colors"
                  />
                  <button
                    onClick={handleSendCode}
                    disabled={!chatId.trim() || status === "verifying"}
                    className="btn btn-primary px-4 text-sm disabled:opacity-40"
                  >
                    {status === "verifying" ? "Sending..." : "Send Code"}
                  </button>
                </div>
              )}

              {step === "otp" && (
                <div className="space-y-2">
                  <p className="text-xs text-safe">Code sent to your Telegram. Enter it here:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="6-digit code"
                      maxLength={6}
                      className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-text font-mono tracking-widest text-center placeholder:text-faint/50 outline-none focus:border-accent/40 transition-colors"
                    />
                    <button
                      onClick={handleConfirmCode}
                      disabled={!otpCode.trim() || status === "verifying"}
                      className="btn btn-primary px-4 text-sm disabled:opacity-40"
                    >
                      {status === "verifying" ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                  <button
                    onClick={() => { setStep("input"); setOtpCode(""); setMessage(""); }}
                    className="text-xs text-faint hover:text-muted transition-colors"
                  >
                    Use a different Chat ID
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
              <div>
                <span className="text-xs text-faint">Chat ID</span>
                <p className="font-mono text-sm text-text">{savedChatId}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDisconnect}
                  className="btn btn-ghost px-3 text-xs text-danger hover:text-danger"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}

        {message && (
          <p className={`mt-3 text-xs ${status === "error" ? "text-danger" : "text-safe"}`}>
            {message}
          </p>
        )}
        </div>
      </BorderGlow>


    </div>
  );
}

function WalletBalanceRow({ address }: { address: `0x${string}` }) {
  const { data: bal } = useWalletBalance(address);
  const balNum = bal ? parseFloat(bal.formatted) : 0;
  return (
    <div className="flex items-center justify-between py-2">
      <span className="font-mono text-xs text-muted">{`${address.slice(0, 8)}...${address.slice(-4)}`}</span>
      <span className="font-mono text-sm font-medium text-text">{balNum.toFixed(4)} MON</span>
    </div>
  );
}

function AIWalletBalances() {
  const { wallets: allWallets } = useWallets();
  const [hiddenWallets] = useState<string[]>(() => getHiddenWallets());
  const wallets = allWallets.filter(
    v => !hiddenWallets.some(h => h.toLowerCase() === v.toLowerCase())
  );
  if (wallets.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl bg-white/[0.03] border border-white/[0.04] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider text-faint">AI Wallets</span>
        <span className="text-[11px] text-muted">{wallets.length} wallet{wallets.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {wallets.map((v) => (
          <WalletBalanceRow key={v} address={v} />
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Account");
  const { address, chain, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-0.5 sm:gap-1 rounded-2xl bg-white/[0.03] p-0.5 sm:p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm transition-all duration-200 ${
              activeTab === tab
                ? "bg-accent/15 text-accent shadow-sm"
                : "text-muted hover:text-text hover:bg-white/[0.03]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Account" && (
        <BorderGlow {...GLOW_PROPS}>
          <div className="p-6">
          <h3 className="mb-5 text-sm font-medium text-text">Wallet</h3>

          {isConnected && address ? (
            <>
              {/* Address */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15">
                  <span className="h-3 w-3 rounded-full bg-accent shadow-[0_0_12px_rgba(131,110,249,0.5)]" />
                </div>
                <div>
                  <p className="font-mono text-sm text-text">{truncateAddress(address)}</p>
                  <p className="text-[11px] text-faint">Connected</p>
                </div>
              </div>

              {/* Network */}
              <div className="mb-3 rounded-2xl bg-white/[0.03] border border-white/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-faint">Network</span>
                  <span className="text-xs text-text">{chain?.name || "Unknown"}</span>
                </div>
              </div>

              {/* Balance */}
              <div className="mb-3 rounded-2xl bg-white/[0.03] border border-white/[0.04] p-4">
                <span className="text-[11px] uppercase tracking-wider text-faint">Balance</span>
                <p className="mt-1.5 font-mono text-2xl font-medium text-text">
                  {balance ? parseFloat(balance.formatted).toFixed(4) : "0.0000"}
                </p>
                <p className="mt-0.5 text-xs text-muted">{balance?.symbol || "MON"}</p>
              </div>

              {/* AI Wallet Balances */}
              <AIWalletBalances />

              {/* Disconnect */}
              <button
                onClick={() => disconnect()}
                className="btn btn-danger w-full"
              >
                Disconnect
              </button>
            </>
          ) : (
            <p className="text-sm text-muted">No wallet connected.</p>
          )}
          </div>
        </BorderGlow>
      )}

      {activeTab === "Alerts" && <AlertsTab />}

      {activeTab === "Danger zone" && (
        <DangerZoneTab disconnect={disconnect} />
      )}
    </div>
  );
}

// --- Danger Zone Tab ---

function DangerZoneTab({ disconnect }: { disconnect: () => void }) {
  const [confirmAction, setConfirmAction] = useState<"revoke" | "sweep" | "disconnect" | null>(null);
  const batchFreeze = useBatchFreeze();
  const batchSweep = useBatchSweep();

  // Reset confirmation when action completes
  useEffect(() => {
    if (batchFreeze.status === "success" || batchFreeze.status === "error") {
      setConfirmAction(null);
    }
  }, [batchFreeze.status]);

  useEffect(() => {
    if (batchSweep.status === "success" || batchSweep.status === "error") {
      setConfirmAction(null);
    }
  }, [batchSweep.status]);

  const isExecuting = batchFreeze.status === "executing" || batchFreeze.status === "loading"
    || batchSweep.status === "executing" || batchSweep.status === "loading";

  return (
    <div className="space-y-4">
      <BorderGlow {...GLOW_PROPS}>
        <div className="p-6">
          <h3 className="mb-2 text-sm font-medium text-danger">Danger zone</h3>
        <p className="mb-5 text-sm text-muted">
          These actions are destructive and may be irreversible.
        </p>

        <div className="space-y-3">
          {/* --- Revoke All Session Keys --- */}
          <div className="rounded-xl border border-danger/10 bg-danger/[0.03] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">Revoke all session keys</p>
                <p className="text-xs text-muted mt-0.5">
                  Instantly freezes every session across all your AI Wallets. They will no longer be able to transact.
                </p>
              </div>
              {confirmAction !== "revoke" && batchFreeze.status !== "executing" && batchFreeze.status !== "loading" && (
                <button
                  onClick={() => setConfirmAction("revoke")}
                  disabled={isExecuting}
                  className="btn btn-danger shrink-0 ml-4"
                >
                  Revoke all
                </button>
              )}
            </div>

            {/* Confirmation */}
            {confirmAction === "revoke" && batchFreeze.status === "idle" && (
              <div className="mt-4 rounded-lg border border-danger/20 bg-danger/5 p-4">
                <p className="text-sm text-danger font-medium mb-1">Are you sure?</p>
                <p className="text-xs text-muted mb-4">
                  This will call <span className="font-mono text-faint">freezeAgent()</span> on every AI Wallet you own.
                  All active session keys will be permanently revoked. Sessions will lose access immediately.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => batchFreeze.execute()}
                    className="btn btn-danger"
                  >
                    Yes, revoke everything
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Progress */}
            {(batchFreeze.status === "loading" || batchFreeze.status === "executing") && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-danger/30 border-t-danger" />
                  <span className="text-sm text-muted">
                    {batchFreeze.status === "loading"
                      ? "Scanning wallets for active session keys..."
                      : `Freezing wallet ${batchFreeze.progress.current} of ${batchFreeze.progress.total}... Confirm in your wallet.`}
                  </span>
                </div>
                {batchFreeze.progress.total > 0 && (
                  <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-danger/60 rounded-full transition-all duration-300"
                      style={{ width: `${(batchFreeze.progress.current / batchFreeze.progress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Success */}
            {batchFreeze.status === "success" && (
              <div className="mt-4 rounded-lg border border-safe/20 bg-safe/5 p-4">
                <p className="text-sm text-safe font-medium">
                  {batchFreeze.totalRevoked > 0
                    ? `Done. ${batchFreeze.totalRevoked} session key${batchFreeze.totalRevoked !== 1 ? "s" : ""} revoked across ${batchFreeze.results.length} wallet${batchFreeze.results.length !== 1 ? "s" : ""}.`
                    : "No active session keys found. Nothing to revoke."}
                </p>
                {batchFreeze.results.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {batchFreeze.results.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-faint">{truncateAddress(r.vault)}</span>
                        <span className="text-muted">{r.keysRevoked} keys revoked</span>
                        {r.hash && (
                          <a
                            href={`${MONAD_TESTNET_EXPLORER}/tx/${r.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:text-accent-hover"
                          >
                            tx &rarr;
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => batchFreeze.reset()} className="mt-3 text-xs text-muted hover:text-text">
                  Dismiss
                </button>
              </div>
            )}

            {/* Error */}
            {batchFreeze.status === "error" && (
              <div className="mt-4 rounded-lg border border-danger/20 bg-danger/5 p-4">
                <p className="text-sm text-danger font-medium">Some operations failed</p>
                <div className="mt-2 space-y-1">
                  {batchFreeze.results.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-faint">{truncateAddress(r.vault)}</span>
                      {r.error ? (
                        <span className="text-danger">{r.error}</span>
                      ) : (
                        <span className="text-safe">{r.keysRevoked} keys revoked</span>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => batchFreeze.reset()} className="mt-3 text-xs text-muted hover:text-text">
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* --- Emergency Withdraw --- */}
          <div className="rounded-xl border border-danger/10 bg-danger/[0.03] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">Emergency withdraw all wallets</p>
                <p className="text-xs text-muted mt-0.5">
                  Withdraws all funds from every AI Wallet back to your connected wallet.
                </p>
              </div>
              {confirmAction !== "sweep" && batchSweep.status !== "executing" && batchSweep.status !== "loading" && (
                <button
                  onClick={() => setConfirmAction("sweep")}
                  disabled={isExecuting}
                  className="btn btn-danger shrink-0 ml-4"
                >
                  Withdraw all
                </button>
              )}
            </div>

            {/* Confirmation */}
            {confirmAction === "sweep" && batchSweep.status === "idle" && (
              <div className="mt-4 rounded-lg border border-danger/20 bg-danger/5 p-4">
                <p className="text-sm text-danger font-medium mb-1">Are you sure?</p>
                <p className="text-xs text-muted mb-4">
                  This will call <span className="font-mono text-faint">emergencyWithdraw()</span> on every AI Wallet with a balance.
                  All funds will be transferred to your connected wallet. Sessions will have no funds to operate.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => batchSweep.execute()}
                    className="btn btn-danger"
                  >
                    Yes, withdraw everything
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Progress */}
            {(batchSweep.status === "loading" || batchSweep.status === "executing") && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-danger/30 border-t-danger" />
                  <span className="text-sm text-muted">
                    {batchSweep.status === "loading"
                      ? "Scanning wallet balances..."
                      : `Withdrawing wallet ${batchSweep.progress.current} of ${batchSweep.progress.total}... Confirm in your wallet.`}
                  </span>
                </div>
                {batchSweep.progress.total > 0 && (
                  <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-danger/60 rounded-full transition-all duration-300"
                      style={{ width: `${(batchSweep.progress.current / batchSweep.progress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Success */}
            {batchSweep.status === "success" && (
              <div className="mt-4 rounded-lg border border-safe/20 bg-safe/5 p-4">
                <p className="text-sm text-safe font-medium">
                  {batchSweep.totalSwept > 0
                    ? `Done. ${batchSweep.totalSwept.toFixed(4)} MON withdrawn back to your wallet.`
                    : "No wallet balances found. Nothing to withdraw."}
                </p>
                {batchSweep.results.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {batchSweep.results.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-faint">{truncateAddress(r.vault)}</span>
                        <span className="text-muted">{parseFloat(r.amount).toFixed(4)} MON</span>
                        {r.hash && (
                          <a
                            href={`${MONAD_TESTNET_EXPLORER}/tx/${r.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:text-accent-hover"
                          >
                            tx &rarr;
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => batchSweep.reset()} className="mt-3 text-xs text-muted hover:text-text">
                  Dismiss
                </button>
              </div>
            )}

            {/* Error */}
            {batchSweep.status === "error" && (
              <div className="mt-4 rounded-lg border border-danger/20 bg-danger/5 p-4">
                <p className="text-sm text-danger font-medium">Some operations failed</p>
                <div className="mt-2 space-y-1">
                  {batchSweep.results.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-faint">{truncateAddress(r.vault)}</span>
                      {r.error ? (
                        <span className="text-danger">{r.error}</span>
                      ) : (
                        <span className="text-safe">{parseFloat(r.amount).toFixed(4)} MON swept</span>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => batchSweep.reset()} className="mt-3 text-xs text-muted hover:text-text">
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* --- Disconnect Wallet --- */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">Disconnect wallet</p>
                <p className="text-xs text-muted mt-0.5">
                  Disconnects your wallet from this browser session. Does not affect on-chain state.
                </p>
              </div>
              {confirmAction !== "disconnect" ? (
                <button
                  onClick={() => setConfirmAction("disconnect")}
                  disabled={isExecuting}
                  className="btn btn-ghost border border-white/[0.08] shrink-0 ml-4"
                >
                  Disconnect
                </button>
              ) : (
                <div className="flex gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => { disconnect(); setConfirmAction(null); }}
                    className="btn btn-danger"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </BorderGlow>
    </div>
  );
}
