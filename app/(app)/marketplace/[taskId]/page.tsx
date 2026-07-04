"use client";

import { use } from "react";
import Link from "next/link";
import { useTask, useReleaseFunds } from "@/hooks/useMarketplace";
import { MONAD_TESTNET_EXPLORER } from "@/lib/chain/config";
import { useAccount } from "wagmi";
import { CastleLoader } from "@/components/app/castle-loader";
import BorderGlow from "@/components/reactbits/interactions/BorderGlow";
import { GLOW_PROPS } from "@/lib/ui";

const LIFECYCLE_STEPS = ["Created", "Accepted", "Submitted", "Released"];

function getStepIndex(status: string): number {
  switch (status) {
    case "Open": return 0;
    case "Accepted": return 1;
    case "Submitted": return 2;
    case "Released": return 3;
    case "Disputed": return -1;
    case "Cancelled": return -1;
    default: return 0;
  }
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId: taskIdStr } = use(params);
  const taskId = parseInt(taskIdStr, 10);
  const { task, isLoading } = useTask(taskId);
  const { address } = useAccount();
  const { release, isPending: isReleasing } = useReleaseFunds();

  if (isLoading || !task) {
    return (
      <div className="space-y-6">
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to Marketplace
        </Link>
        <CastleLoader />
      </div>
    );
  }

  const isBuyer = address?.toLowerCase() === task.buyer.toLowerCase();
  const canRelease = isBuyer && task.status === "Submitted";
  const stepIndex = getStepIndex(task.status);
  const rewardMon = (Number(task.reward) / 1e18).toFixed(2);
  const deadlineDate = new Date(Number(task.deadline) * 1000);
  const createdDate = new Date(Number(task.createdAt) * 1000);
  const isExpired = Date.now() > deadlineDate.getTime();

  return (
    <div className="space-y-6">
      <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Back to Marketplace
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Task #{task.id}</h1>
          <p className="mt-1 text-sm text-muted truncate max-w-md">{task.specURI || "No description"}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
          task.status === "Open" ? "bg-accent/10 text-accent" :
          task.status === "Released" ? "bg-safe/10 text-safe" :
          task.status === "Disputed" ? "bg-danger/10 text-danger" :
          task.status === "Cancelled" ? "bg-faint/10 text-faint" :
          "bg-white/[0.06] text-muted"
        }`}>
          {task.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Main content */}
        <div className="space-y-4">
          {/* Spec */}
          <BorderGlow {...GLOW_PROPS}>
            <div className="p-5">
              <h3 className="mb-3 text-sm font-medium text-text">Task specification</h3>
              <p className="text-sm leading-relaxed text-muted">
                {task.specURI || "No spec provided."}
              </p>
              {task.resultURI && (
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <p className="text-[11px] text-faint uppercase tracking-wider mb-1">Result</p>
                  <p className="text-sm text-text font-mono break-all">{task.resultURI}</p>
                </div>
              )}
            </div>
          </BorderGlow>

          {/* Lifecycle */}
          <BorderGlow {...GLOW_PROPS}>
            <div className="p-5">
              <h3 className="mb-4 text-sm font-medium text-text">Lifecycle</h3>
              {task.status === "Disputed" || task.status === "Cancelled" ? (
                <div className={`rounded-lg p-3 ${task.status === "Disputed" ? "bg-danger/5 border border-danger/20" : "bg-white/[0.03] border border-white/[0.06]"}`}>
                  <p className={`text-sm font-medium ${task.status === "Disputed" ? "text-danger" : "text-faint"}`}>
                    {task.status === "Disputed" ? "This task is disputed." : "This task was cancelled."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {LIFECYCLE_STEPS.map((step, i) => (
                    <div key={step} className="flex items-center gap-3">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium ${
                        i <= stepIndex ? "bg-accent text-bg" : "bg-white/[0.04] text-faint"
                      }`}>
                        {i <= stepIndex ? "\u2713" : i + 1}
                      </span>
                      <span className={`text-sm ${i <= stepIndex ? "text-text" : "text-faint"}`}>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BorderGlow>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <BorderGlow {...GLOW_PROPS}>
            <div className="p-5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Reward in escrow</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-accent">{rewardMon} MON</p>
              <p className="mt-1 text-xs text-muted">
                {task.status === "Released" ? "Released to worker" : "Locked until release or dispute"}
              </p>
            </div>
          </BorderGlow>

          <BorderGlow {...GLOW_PROPS}>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-[11px] text-faint">Buyer</p>
                <p className="font-mono text-xs text-text mt-0.5">{task.buyer.slice(0, 10)}...{task.buyer.slice(-4)}</p>
              </div>
              {task.worker !== "0x0000000000000000000000000000000000000000" && (
                <div>
                  <p className="text-[11px] text-faint">Worker</p>
                  <p className="font-mono text-xs text-text mt-0.5">{task.worker.slice(0, 10)}...{task.worker.slice(-4)}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-faint">Created</p>
                <p className="text-xs text-text mt-0.5">{createdDate.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-faint">Deadline</p>
                <p className={`text-xs mt-0.5 ${isExpired ? "text-danger" : "text-text"}`}>
                  {deadlineDate.toLocaleString()} {isExpired && "(expired)"}
                </p>
              </div>
            </div>
          </BorderGlow>

          {/* Actions */}
          {canRelease && (
            <button
              onClick={() => release(task.id)}
              disabled={isReleasing}
              className="btn btn-primary w-full"
            >
              {isReleasing ? "Releasing..." : "Release Funds to Worker"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
