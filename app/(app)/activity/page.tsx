"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useActivityFeed, type ActivityEvent } from "@/hooks/useActivityFeed";
import { useServerActivity, type ServerActivityItem } from "@/hooks/useServerActivity";
import { type SessionActivity } from "@/lib/activity-store";
import { useWalletNames } from "@/hooks/useWalletNames";
import { CONTRACTS } from "@/lib/chain/addresses";
import { MONAD_TESTNET_EXPLORER } from "@/lib/chain/config";
import { StatusIcon } from "@/components/app/status-icon";
import FadeContent from "@/components/reactbits/interactions/FadeContent";
import BorderGlow from "@/components/reactbits/interactions/BorderGlow";
import { GLOW_PROPS } from "@/lib/ui";

type Tab = "live" | "sessions";

// Event type config
function getEventStyle(eventName: string): { icon: React.ReactNode; color: string; bgColor: string } {
  switch (eventName) {
    case "TaskCreated":
      return {
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
        color: "text-accent",
        bgColor: "bg-accent/10",
      };
    case "TaskAccepted":
      return {
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>,
        color: "text-safe",
        bgColor: "bg-safe/10",
      };
    case "WorkSubmitted":
      return {
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>,
        color: "text-[#38bdf8]",
        bgColor: "bg-[#38bdf8]/10",
      };
    case "FundsReleased":
      return {
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
        color: "text-safe",
        bgColor: "bg-safe/10",
      };
    case "TaskDisputed":
      return {
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4M12 17h.01" /></svg>,
        color: "text-danger",
        bgColor: "bg-danger/10",
      };
    case "TaskCancelled":
      return {
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>,
        color: "text-faint",
        bgColor: "bg-white/[0.04]",
      };
    case "AgentExecution":
      return {
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>,
        color: "text-accent",
        bgColor: "bg-accent/10",
      };
    default:
      return {
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>,
        color: "text-muted",
        bgColor: "bg-white/[0.04]",
      };
  }
}

function LiveEventRow({ event }: { event: ActivityEvent }) {
  const style = getEventStyle(event.eventName);
  return (
    <FadeContent blur={false} duration={300} delay={0} threshold={0.05}>
      <div className="flex items-center gap-2.5 border-b border-white/[0.03] px-4 py-3 transition-colors last:border-b-0 hover:bg-white/[0.02]">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.bgColor} ${style.color}`}>
          {style.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium ${style.color}`}>{event.eventName}</span>
            {event.txHash && (
              <a href={`${MONAD_TESTNET_EXPLORER}/tx/${event.txHash}`} target="_blank" rel="noopener noreferrer" className="hidden sm:inline font-mono text-[10px] text-accent/50 hover:text-accent">
                {event.txHash.slice(0, 8)}...
              </a>
            )}
          </div>
          <p className="text-[10px] text-muted mt-0.5 truncate">{event.action}</p>
        </div>
        <div className="shrink-0 text-right">
          {event.amount ? (
            <span className="font-mono text-xs font-medium text-text">{event.amount}</span>
          ) : (
            <span className="text-[10px] text-faint">—</span>
          )}
        </div>
        <span className="shrink-0 w-14 text-right font-mono text-[10px] text-faint">
          {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </FadeContent>
  );
}

function ServerTxRow({ tx }: { tx: ServerActivityItem }) {
  const pending = !tx.executed;
  const failed = tx.executed && tx.success === false;
  const label = tx.agentName || `${tx.agentAddress.slice(0, 6)}...${tx.agentAddress.slice(-4)}`;
  const ts = new Date(tx.createdAt).getTime();

  return (
    <div className="flex items-center gap-2.5 border-b border-white/[0.03] px-4 py-3 transition-colors last:border-b-0 hover:bg-white/[0.02]">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          failed ? "bg-danger/10 text-danger" : pending ? "bg-warning/10 text-warning" : "bg-safe/10 text-safe"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-text truncate">{label}</span>
          <span className="text-[10px] text-faint font-mono">{tx.functionName}</span>
          {failed && <span className="text-[9px] font-semibold uppercase text-danger">failed</span>}
          {pending && <span className="text-[9px] font-semibold uppercase text-warning">pending</span>}
        </div>
        <p className="text-[10px] text-muted mt-0.5 truncate">
          &#x2192; {tx.target.slice(0, 10)}...{tx.target.slice(-4)}
          {tx.memo ? ` · ${tx.memo}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {tx.valueMon && parseFloat(tx.valueMon) > 0 ? (
          <span className="font-mono text-xs font-medium text-text">{parseFloat(tx.valueMon).toFixed(4)} MON</span>
        ) : (
          <span className="text-[10px] text-faint">0 MON</span>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <span className="w-14 text-right font-mono text-[10px] text-faint">
          {new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        {tx.txHash && (
          <a href={`${MONAD_TESTNET_EXPLORER}/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent/50 hover:text-accent">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
          </a>
        )}
      </div>
    </div>
  );
}

function SessionActivityRow({ activity }: { activity: SessionActivity }) {
  const { getDisplayName } = useWalletNames();
  const name = getDisplayName(activity.sessionKey);
  return (
    <div className="flex items-center gap-2.5 border-b border-white/[0.03] px-4 py-3 transition-colors last:border-b-0 hover:bg-white/[0.02]">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-text">{name}</span>
          <span className="text-[10px] text-faint font-mono">{activity.selector}</span>
        </div>
        <p className="text-[10px] text-muted mt-0.5 truncate">
          &#x2192; {activity.target.slice(0, 10)}...{activity.target.slice(-4)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {activity.value !== "0" ? (
          <span className="font-mono text-xs font-medium text-text">{parseFloat(activity.value).toFixed(4)} MON</span>
        ) : (
          <span className="text-[10px] text-faint">0 MON</span>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        <span className="w-14 text-right font-mono text-[10px] text-faint">
          {new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        {activity.txHash && (
          <a href={`${MONAD_TESTNET_EXPLORER}/tx/${activity.txHash}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent/50 hover:text-accent">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
          </a>
        )}
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const { events, sessionLogs } = useActivityFeed();
  const {
    transactions: serverTxs,
    isLoading: serverLoading,
    needsAuth,
    sync,
    error: serverError,
  } = useServerActivity();
  const [tab, setTab] = useState<Tab>("live");
  const contractsDeployed = CONTRACTS.escrow !== "0x0000000000000000000000000000000000000000";

  // Server-sourced history (parity with Telegram), deduped against live events by tx hash.
  const liveHashes = new Set(events.map((e) => e.txHash).filter(Boolean));
  const historyTxs = serverTxs.filter((t) => !t.txHash || !liveHashes.has(t.txHash as `0x${string}`));
  const hasLiveContent = events.length > 0 || historyTxs.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text">Activity</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">On-chain events and session history</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/[0.04] px-2.5 py-1">
          <StatusIcon variant={contractsDeployed ? "live" : "offline"} size={10} pulse={contractsDeployed} />
          <span className="text-[10px] text-muted">{contractsDeployed ? "Live" : "Offline"}</span>
        </div>
      </div>

      {!contractsDeployed && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
          <p className="text-sm text-warning">Contracts not deployed. Activity will appear once contracts are live.</p>
        </div>
      )}

      {/* Full-history sync prompt — surfaces past agent sends (parity with Telegram). */}
      {needsAuth && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-text">Load full history</p>
            <p className="mt-0.5 text-xs text-muted">
              The live feed only shows events since you opened the app. Sign once to load past agent transactions.
            </p>
          </div>
          <button onClick={sync} disabled={serverLoading} className="btn btn-primary text-xs shrink-0">
            {serverLoading ? "Loading..." : "Sync history"}
          </button>
        </div>
      )}

      {serverError && !needsAuth && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-3">
          <p className="text-xs text-danger">Could not load history: {serverError}</p>
          <button onClick={sync} className="mt-1.5 text-[11px] text-accent hover:underline">Try again</button>
        </div>
      )}

      {/* Tabs */}
      <div className="relative flex gap-1 rounded-full bg-white/[0.04] border border-white/[0.06] p-1 w-fit">
        {(["live", "sessions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="relative z-10 px-4 py-1.5 rounded-full text-xs font-medium transition-colors duration-200"
          >
            {tab === t && (
              <motion.span
                layoutId="activity-tab-pill"
                className="absolute inset-0 rounded-full bg-white/[0.10] border border-white/[0.08] shadow-[0_0_12px_rgba(131,110,249,0.08)]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className={`relative z-10 ${tab === t ? "text-text" : "text-faint hover:text-muted"}`}>
              {t === "live" ? "Live Feed" : "Session History"}
              {t === "live" && events.length > 0 && (
                <span className="ml-1.5 text-[10px] text-accent">{events.length}</span>
              )}
              {t === "sessions" && sessionLogs.length > 0 && (
                <span className="ml-1.5 text-[10px] text-accent">{sessionLogs.length}</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Live feed */}
      <AnimatePresence mode="wait">
      {tab === "live" && (
        <motion.div
          key="live"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
        <BorderGlow {...GLOW_PROPS}>
          <div className="overflow-hidden">
            {!hasLiveContent ? (
              <div className="px-4 py-14 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-faint">
                    <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <p className="text-xs text-muted">{serverLoading ? "Loading history..." : "No live events yet"}</p>
                <p className="text-[10px] text-faint mt-1">Events appear here as agents transact on-chain.</p>
              </div>
            ) : (
              <>
                {events.map((event) => <LiveEventRow key={event.id} event={event} />)}
                {historyTxs.length > 0 && (
                  <>
                    {events.length > 0 && (
                      <div className="px-4 py-1.5 border-b border-white/[0.06] bg-white/[0.01]">
                        <p className="eyebrow">History</p>
                      </div>
                    )}
                    {historyTxs.map((tx, i) => (
                      <ServerTxRow key={tx.txHash || `${tx.createdAt}-${i}`} tx={tx} />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </BorderGlow>
        </motion.div>
      )}

      {/* Session history (persisted — survives expiry, cleared on revoke) */}
      {tab === "sessions" && (
        <motion.div
          key="sessions"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
        <BorderGlow {...GLOW_PROPS}>
          <div className="overflow-hidden">
            {sessionLogs.length === 0 ? (
              <div className="px-4 py-14 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-faint">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <p className="text-xs text-muted">No session activity recorded</p>
                <p className="text-[10px] text-faint mt-1">
                  Transactions by your AI sessions appear here.<br />
                  Revoked sessions have their logs cleared. Expired sessions keep their history.
                </p>
              </div>
            ) : (
              <>
                <div className="px-4 py-2 border-b border-white/[0.06]">
                  <p className="text-[10px] text-faint">
                    Showing {sessionLogs.length} transaction{sessionLogs.length !== 1 ? "s" : ""} from active and expired sessions. Revoked sessions are cleared.
                  </p>
                </div>
                {sessionLogs.map((activity) => <SessionActivityRow key={activity.id} activity={activity} />)}
              </>
            )}
          </div>
        </BorderGlow>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Legend */}
      {tab === "live" && events.length > 0 && (
        <div className="flex flex-wrap gap-3 text-[10px]">
          <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Created</div>
          <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-safe" />Accepted / Released</div>
          <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#38bdf8]" />Submitted</div>
          <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-danger" />Disputed</div>
        </div>
      )}
    </div>
  );
}
