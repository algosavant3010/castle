"use client";

import { useState } from "react";
import { useTaskCount, useTask, useCreateTask, useReleaseFunds, type Task, type TaskStatus } from "@/hooks/useMarketplace";
import { CONTRACTS } from "@/lib/chain/addresses";
import { MONAD_TESTNET_EXPLORER } from "@/lib/chain/config";
import { useAccount } from "wagmi";
import { CastleLoader } from "@/components/app/castle-loader";
import Link from "next/link";
import BorderGlow from "@/components/reactbits/interactions/BorderGlow";

import { GLOW_PROPS } from "@/lib/ui";

const STATUS_TABS: TaskStatus[] = ["Open", "Accepted", "Submitted", "Released", "Disputed"];

function TaskCard({ taskId, filterStatus }: { taskId: number; filterStatus: TaskStatus }) {
  const { task, isLoading } = useTask(taskId);
  const { address } = useAccount();
  const { release, isPending: isReleasing } = useReleaseFunds();

  if (isLoading || !task) {
    return <CastleLoader variant="inline" />;
  }

  // Filter: only show tasks matching the active tab
  if (task.status !== filterStatus) return null;

  const isBuyer = address?.toLowerCase() === task.buyer.toLowerCase();
  const canRelease = isBuyer && task.status === "Submitted";

  return (
    <Link href={`/marketplace/${task.id}`}>
      <BorderGlow {...GLOW_PROPS}>
        <div className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-transform duration-150 active:scale-[0.99]">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
          task.status === "Open" ? "bg-accent/15 text-accent" :
          task.status === "Released" ? "bg-safe/10 text-safe" :
          task.status === "Disputed" ? "bg-danger/10 text-danger" :
          "bg-white/[0.06] text-muted"
        }`}>
          {task.status}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text truncate">{task.specURI}</p>
          <p className="mt-0.5 text-xs text-faint">
            Task #{task.id} · Buyer: {`${task.buyer.slice(0, 6)}...${task.buyer.slice(-4)}`}
            {task.worker !== "0x0000000000000000000000000000000000000000" && (
              <> · Worker: {`${task.worker.slice(0, 6)}...${task.worker.slice(-4)}`}</>
            )}
          </p>
        </div>
        <span className="font-mono text-sm font-medium text-accent shrink-0">
          {(Number(task.reward) / 1e18).toFixed(2)} MON
        </span>
        {canRelease && (
          <button
            onClick={(e) => { e.preventDefault(); release(task.id); }}
            disabled={isReleasing}
            className="btn text-xs bg-safe/10 text-safe border-safe/20 hover:bg-safe/20"
          >
            {isReleasing ? "Releasing..." : "Release"}
          </button>
        )}
        </div>
      </BorderGlow>
    </Link>
  );
}

function CreateTaskDialog({ onClose }: { onClose: () => void }) {
  const [spec, setSpec] = useState("");
  const [reward, setReward] = useState("1");
  const [deadlineHours, setDeadlineHours] = useState("24");
  const { createTask, isPending, isConfirming, isSuccess, hash } = useCreateTask();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong p-6">
        <h2 className="text-lg font-semibold text-text">Create Task</h2>
        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs text-faint block mb-1.5">Task description</label>
            <textarea
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              placeholder="Describe the task for the agent..."
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-text placeholder:text-faint backdrop-blur-sm resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs text-faint block mb-1.5">Reward (MON)</label>
            <input
              type="number"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-text backdrop-blur-sm"
            />
          </div>
          <div>
            <label className="text-xs text-faint block mb-1.5">Deadline (hours)</label>
            <input
              type="number"
              value={deadlineHours}
              onChange={(e) => setDeadlineHours(e.target.value)}
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-text backdrop-blur-sm"
            />
          </div>

          {isSuccess && hash && (
            <div className="rounded-xl border border-safe/20 bg-safe/5 p-3">
              <p className="text-sm text-safe">Task created!</p>
              <a href={`${MONAD_TESTNET_EXPLORER}/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="link-accent font-mono text-xs">
                View transaction →
              </a>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn btn-ghost flex-1">
              {isSuccess ? "Close" : "Cancel"}
            </button>
            {!isSuccess && (
              <button
                onClick={() => createTask(spec, parseInt(deadlineHours), reward)}
                disabled={!spec || !reward || isPending || isConfirming}
                className="btn btn-primary flex-1"
              >
                {isPending ? "Confirm..." : isConfirming ? "Creating..." : `Create (${reward} MON)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<TaskStatus>("Open");
  const [showCreate, setShowCreate] = useState(false);
  const { data: taskCount } = useTaskCount();

  const contractsDeployed = CONTRACTS.escrow !== "0x0000000000000000000000000000000000000000";
  const count = taskCount ? Number(taskCount) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text">Marketplace</h1>
          <p className="mt-0.5 sm:mt-1 text-[12px] sm:text-sm text-muted">Post tasks or browse open work</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!contractsDeployed}
          className="btn btn-primary text-[12px] sm:text-sm shrink-0"
        >
          Create task
        </button>
      </div>

      {!contractsDeployed && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
          <p className="text-sm text-warning">Contracts not yet deployed.</p>
          <p className="mt-1 text-xs text-muted">Deploy contracts and update addresses to use the marketplace.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 sm:gap-1 rounded-2xl bg-white/[0.03] p-0.5 sm:p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-sm transition-all duration-200 ${
              activeTab === tab
                ? "bg-accent/15 text-accent shadow-sm"
                : "text-muted hover:text-text hover:bg-white/[0.03]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {count === 0 && contractsDeployed && (
          <BorderGlow {...GLOW_PROPS}>
            <div className="flex flex-col items-center justify-center py-14">
              <p className="text-lg font-medium text-text">No tasks yet</p>
              <p className="mt-1.5 text-sm text-muted">Create one to get started.</p>
            </div>
          </BorderGlow>
        )}
        {Array.from({ length: count }, (_, i) => count - 1 - i).map((taskId) => (
          <TaskCard key={taskId} taskId={taskId} filterStatus={activeTab} />
        ))}
      </div>

      {showCreate && <CreateTaskDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}
