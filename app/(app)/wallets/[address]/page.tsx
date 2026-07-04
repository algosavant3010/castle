"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useSignMessage } from "wagmi";
import { parseEther } from "viem";
import { useWalletBalance } from "@/hooks/useWallets";
import { useActiveKeys, useSessionPolicy, computeSessionStatus } from "@/hooks/useSessions";
import { useFreeze } from "@/hooks/useFreeze";
import { useWithdrawFunds } from "@/hooks/useWithdrawFunds";
import { useRegisterSession } from "@/hooks/useRegisterSession";
import { useRevokeSession } from "@/hooks/useRevokeSession";
import { CONTRACTS } from "@/lib/chain/addresses";
import { MONAD_TESTNET_EXPLORER } from "@/lib/chain/config";
import { hideWallet } from "@/lib/hidden-wallets-store";
import { removeWalletMeta, saveWalletMeta } from "@/lib/wallet-meta-store";
import { clearWalletActivity } from "@/lib/activity-store";
import { buildAuthMessage, SERVER_URL } from "@/lib/owner-auth";
import { useWalletNames } from "@/hooks/useWalletNames";
import { CopyButton } from "@/components/app/copy-button";
import Link from "next/link";
import { CastleLoader } from "@/components/app/castle-loader";
import BorderGlow from "@/components/reactbits/interactions/BorderGlow";
import { GLOW_PROPS } from "@/lib/ui";

// --- Icons (Icons8 iOS style, white for dark UI) ---
// Removed — using inline SVGs instead for consistency

// --- Types ---
type AgentPreset = "marketplace" | "payments" | "custom";

interface PresetConfig {
  label: string;
  description: string;
  target: string;
  functions: { name: string; selector: `0x${string}` }[];
}

const PRESETS: Record<AgentPreset, PresetConfig> = {
  marketplace: {
    label: "Marketplace Worker",
    description: "Accept and complete tasks on CastleEscrow.",
    target: CONTRACTS.escrow,
    functions: [
      { name: "acceptTask(uint256)", selector: "0xe458b42c" },
      { name: "submitWork(uint256,string)", selector: "0x5e21b355" },
    ],
  },
  payments: {
    label: "Payment Agent",
    description: "Send MON via the PaymentRouter.",
    target: CONTRACTS.paymentRouter || "0x0000000000000000000000000000000000000000",
    functions: [
      { name: "send(address)", selector: "0x3e58c58c" },
      { name: "sendWithMemo(address,string)", selector: "0x4b8a3529" },
    ],
  },
  custom: {
    label: "Custom Contract",
    description: "Configure a custom target and selectors.",
    target: "",
    functions: [],
  },
};

// --- System prompt generator ---
function generateSystemPrompt(
  vaultAddress: string,
  accessToken: string,
  config: PresetConfig,
  dailyCap: string,
  expiryHours: string,
  approvalThreshold: string,
  agentName: string
): string {
  const hasApproval = parseFloat(approvalThreshold) > 0;
  const BASE = `${SERVER_URL}/api/agent`;
  return `You are "${agentName}", an autonomous AI wallet agent on Monad blockchain, powered by the Castle protocol.

You OWN a crypto wallet. You can check balances and send MON tokens by making HTTP requests to a REST API. The server handles all blockchain signing — you just call the endpoints.

## CRITICAL RULES — READ FIRST
- Make HTTP requests DIRECTLY. Do NOT create files, scripts, shell commands, or code blocks to execute later.
- Every request needs this header: Authorization: Bearer ${accessToken}
- Content-Type for POST requests: application/json
- Respond to the user with the RESULT of your API call, not the code to make it.
- NEVER fabricate or assume a response. Only report data you actually received from the API.
- If a request fails, show the error message from the response and explain what it means.

## YOUR WALLET
- Vault: ${vaultAddress}
- Network: Monad Testnet (Chain ID 10143)
- Daily budget: ${dailyCap} MON
- Session expires in: ${expiryHours} hours
- Allowed target: ${config.target}
- Allowed functions: ${config.functions.map((f) => f.name).join(", ") || "any on target"}
${hasApproval ? `- Transactions up to ${approvalThreshold} MON: auto-approved\n- Transactions above ${approvalThreshold} MON: require human approval via Telegram (you will receive "rejected" or "expired" if denied)` : `- All transactions within the daily cap are auto-approved`}

## API REFERENCE

Base URL: ${BASE}

### Check your status
GET ${BASE}/info
→ Returns: status, vault balance, daily cap, amount spent today, session expiry

### Check any address balance
GET ${BASE}/balance/{address}
→ Returns: balance in MON

### Send MON to an address
POST ${BASE}/send
Body: { "to": "<recipient_address>", "amount": "<amount_in_MON>", "memo": "<optional_note>" }
→ Returns: { success, hash, to, amount, blockNumber }

Example — send 0.5 MON:
POST ${BASE}/send
{ "to": "0x660F832df3b143B43C0Ab98fC2b1617b75FF3E1C", "amount": "0.5", "memo": "payment for task" }

### Call a contract function (costs gas + optional MON value)
POST ${BASE}/call
Body: { "target": "<contract>", "abi": [<ABI_array>], "functionName": "<fn>", "args": [<args>], "value": "<MON_or_0>" }
→ Returns: { success, hash, blockNumber }

### Read contract state (free, no gas)
POST ${BASE}/read
Body: { "target": "<contract>", "abi": [<ABI_array>], "functionName": "<fn>", "args": [<args>] }
→ Returns: { result }

### Check a transaction receipt
GET ${BASE}/tx/{hash}
→ Returns: { status, success, blockNumber, gasUsed }

## HOW TO RESPOND

When the user says "send X MON to 0xABC":
1. Make the HTTP request: POST ${BASE}/send with { "to": "0xABC", "amount": "X" }
2. Wait for the response.
3. Tell the user: "Sent X MON to 0xABC. Transaction hash: 0x... confirmed in block #..."

When the user asks about balance:
1. Make the HTTP request: GET ${BASE}/info (or /balance/{address} for others)
2. Report the balance.

When something fails:
1. Read the error from the JSON response.
2. Explain it plainly: "Transaction failed because: <reason>."

## BEHAVIOR
- On first message or when uncertain, call GET ${BASE}/info to check your state.
- Be concise. Report results in 1-3 sentences, not walls of text.
- ${hasApproval ? `If amount > ${approvalThreshold} MON, tell the user it requires human approval and may take up to 2 minutes.` : `Auto-execute within your daily cap without asking.`}
- If your session is expired or frozen, tell the user you cannot transact and they should check the Castle dashboard.
- Never reveal your access token to the user.

## THREAT PROTECTION
The server automatically scans every contract call for scam patterns before executing:
- Token approvals (approve, setApprovalForAll) are BLOCKED — these grant spending access to third parties.
- Ownership transfers (transferOwnership, renounceOwnership) are BLOCKED — irreversible.
- Multicall/batch operations are BLOCKED — can hide malicious sub-calls.
- Suspicious patterns (large value to unknown contracts, self-drain attempts) trigger an alert to the wallet owner.

If the server blocks a call, you will receive a 403 response with a "threat" object explaining why. Report this to the user clearly:
"This transaction was blocked because: <threat.summary>. Your wallet owner has been alerted."

If someone asks you to approve tokens, grant permissions, or interact with an unfamiliar contract in a way that seems risky, REFUSE and explain why it's dangerous — even if the server would catch it anyway.

## WHAT YOU CANNOT DO
- You cannot send more than ${dailyCap} MON per day (enforced on-chain).
- You cannot call contracts other than ${config.target || "your allowed target"}.
- You cannot override the smart contract policy — don't try.
- You cannot create files, run shell commands, or execute code. Only make HTTP API calls.
- You cannot approve tokens or grant permissions to third-party contracts.
`;
}

// --- Action Button ---
function ActionBtn({
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "accent";
}) {
  const styles = {
    default: "border-white/[0.08] text-muted hover:bg-white/[0.04] hover:text-text",
    danger: "border-danger/20 text-danger/80 hover:bg-danger/10 hover:text-danger",
    accent: "border-accent/20 text-accent/80 hover:bg-accent/10 hover:text-accent",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`action-btn action-btn--${variant} rounded-lg border px-3 py-1.5 text-[11px] font-medium disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]}`}
    >
      {label}
    </button>
  );
}

// --- Session Row (expandable) ---
function SessionRow({
  walletAddress,
  keyAddress,
  onRevoke,
  isRevoking,
}: {
  walletAddress: `0x${string}`;
  keyAddress: `0x${string}`;
  onRevoke: (key: `0x${string}`) => void;
  isRevoking: boolean;
}) {
  const { data: policy } = useSessionPolicy(walletAddress, keyAddress);
  const [expanded, setExpanded] = useState(false);

  if (!policy) return <CastleLoader variant="inline" />;

  const [expiry, dailyCap, spentToday, , allowedTarget, allowedFns, active] = policy as [
    bigint, bigint, bigint, bigint, `0x${string}`, `0x${string}`[], boolean
  ];
  const status = computeSessionStatus(expiry, active, spentToday, dailyCap);

  const timeRemaining = Math.max(0, Number(expiry) - Math.floor(Date.now() / 1000));
  const hoursLeft = Math.floor(timeRemaining / 3600);
  const minutesLeft = Math.floor((timeRemaining % 3600) / 60);
  const timeDisplay = timeRemaining > 0 ? `${hoursLeft}h ${minutesLeft}m` : "Expired";
  const spentDisplay = `${(Number(spentToday) / 1e18).toFixed(2)} / ${(Number(dailyCap) / 1e18).toFixed(0)} MON`;

  const statusColor =
    status === "active" ? "text-safe" :
    status === "expiring" ? "text-warning" :
    status === "frozen" ? "text-danger" : "text-faint";

  return (
    <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] overflow-hidden">
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className={`h-2 w-2 rounded-full shrink-0 ${
          status === "active" ? "bg-safe" :
          status === "expiring" ? "bg-warning" :
          status === "frozen" ? "bg-danger" : "bg-faint/40"
        }`} />
        <span className="text-xs text-muted flex-1 truncate">{timeDisplay}</span>
        <span className="font-mono text-[11px] text-faint">{spentDisplay}</span>
        <span className={`text-[11px] font-medium w-16 text-right ${statusColor}`}>{status}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`text-faint transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.04] space-y-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
            <div>
              <span className="text-faint">Daily Cap</span>
              <p className="text-text font-mono">{(Number(dailyCap) / 1e18).toFixed(2)} MON</p>
            </div>
            <div>
              <span className="text-faint">Spent Today</span>
              <p className="text-text font-mono">{(Number(spentToday) / 1e18).toFixed(4)} MON</p>
            </div>
            <div>
              <span className="text-faint">Expires</span>
              <p className="text-text font-mono">{new Date(Number(expiry) * 1000).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-faint">Target</span>
              <p className="text-text font-mono truncate" title={allowedTarget}>{allowedTarget.slice(0, 10)}...{allowedTarget.slice(-4)}</p>
            </div>
            {allowedFns.length > 0 && (
              <div className="col-span-2">
                <span className="text-faint">Allowed Functions</span>
                <p className="text-text font-mono">{allowedFns.join(", ")}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          {active && (
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
              <button
                onClick={() => onRevoke(keyAddress)}
                disabled={isRevoking}
                className="action-btn action-btn--danger inline-flex items-center gap-1.5 rounded-lg border border-danger/20 px-2.5 py-1.5 text-[11px] font-medium text-danger/80 hover:bg-danger/10 hover:text-danger disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                {isRevoking ? "Revoking..." : "Revoke"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Create Session Panel ---
function CreateSessionPanel({
  walletAddress,
  onClose,
  onSuccess,
}: {
  walletAddress: `0x${string}`;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { address: userAddress } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { register, reset: resetRegister, isPending: isRegistering, isConfirming: isRegConfirming, isSuccess: isRegSuccess, error: regError, hash: regHash } = useRegisterSession(walletAddress);

  const [sessionStep, setSessionStep] = useState<"configure" | "creating" | "registering" | "output">("configure");
  const [preset, setPreset] = useState<AgentPreset>("payments");
  const [agentName, setAgentName] = useState("");
  const [customTarget, setCustomTarget] = useState("");
  const [customSelectors, setCustomSelectors] = useState("");
  const [dailyCap, setDailyCap] = useState("10");
  const [expiryHours, setExpiryHours] = useState("24");
  const [approvalThreshold, setApprovalThreshold] = useState("0");
  const [approvalEnabled, setApprovalEnabled] = useState(false);
  const [error, setError] = useState("");

  const [outputToken, setOutputToken] = useState("");
  const [outputAgentAddress, setOutputAgentAddress] = useState("");
  const [sessionKeyAddress, setSessionKeyAddress] = useState<`0x${string}` | "">("");
  const creatingRef = useRef(false);

  const currentConfig = preset === "custom"
    ? { ...PRESETS.custom, target: customTarget, functions: customSelectors.split(",").map((s) => s.trim()).filter(Boolean).map((s) => ({ name: s, selector: s.slice(0, 10) as `0x${string}` })) }
    : PRESETS[preset];

  // Handle register error (MetaMask cancel)
  useEffect(() => {
    if (regError && sessionStep === "registering") {
      const msg = regError.message?.includes("User rejected")
        ? "Transaction cancelled."
        : regError.message || "Registration failed.";
      setError(msg);
      setSessionStep("configure");
      resetRegister();
    }
  }, [regError, sessionStep, resetRegister]);

  // Server-side agent creation
  useEffect(() => {
    if (sessionStep !== "creating" || !walletAddress || !userAddress || sessionKeyAddress || creatingRef.current) return;
    creatingRef.current = true;
    (async () => {
      try {
        const target = preset === "custom" ? customTarget : currentConfig.target;
        const timestamp = Date.now();
        const message = buildAuthMessage("create-agent", userAddress, timestamp);
        const signature = await signMessageAsync({ message });

        const res = await fetch(`${SERVER_URL}/api/agents/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerAddress: userAddress,
            authMessage: message,
            authSignature: signature,
            vaultAddress: walletAddress,
            name: agentName || PRESETS[preset].label,
            preset,
            dailyCap,
            approvalThreshold,
            expiryHours,
            allowedTarget: target,
            allowedFunctions: currentConfig.functions.map((f) => f.selector),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create agent.");

        setSessionKeyAddress(data.sessionKeyAddress);
        setOutputToken(data.accessToken);
        setSessionStep("registering");
      } catch (err) {
        creatingRef.current = false;
        const msg = err instanceof Error ? err.message : "Failed to create agent.";
        setError(msg.includes("User rejected") || msg.includes("user rejected") ? "Signature cancelled." : msg);
        setSessionStep("configure");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStep, walletAddress, userAddress, sessionKeyAddress]);

  // Register on-chain
  useEffect(() => {
    if (sessionStep === "registering" && walletAddress && sessionKeyAddress && !isRegistering && !isRegConfirming && !isRegSuccess) {
      const target = preset === "custom" ? customTarget : currentConfig.target;
      const selectors = currentConfig.functions.map((f) => f.selector);
      const expiry = BigInt(Math.floor(Date.now() / 1000) + parseInt(expiryHours) * 3600);
      const cap = parseEther(dailyCap);
      register(sessionKeyAddress as `0x${string}`, expiry, cap, target as `0x${string}`, selectors);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStep, walletAddress, sessionKeyAddress]);

  // Success
  useEffect(() => {
    if (isRegSuccess && sessionStep === "registering" && sessionKeyAddress) {
      setOutputAgentAddress(sessionKeyAddress);
      saveWalletMeta(sessionKeyAddress, {
        name: agentName || PRESETS[preset].label,
        preset,
        createdAt: new Date().toISOString(),
        walletAddress,
        dailyCap,
        approvalThreshold,
        expiryHours,
      });
      setSessionStep("output");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegSuccess, sessionStep]);

  const handleCreate = () => {
    setError("");
    if (!userAddress) { setError("Connect your wallet first."); return; }
    const capNum = parseFloat(dailyCap);
    const hoursNum = parseInt(expiryHours);
    if (isNaN(capNum) || capNum <= 0) { setError("Daily cap must be positive."); return; }
    if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 8760) { setError("Expiry: 1-8760 hours."); return; }
    if (preset === "custom" && !customTarget) { setError("Custom target address required."); return; }
    setSessionKeyAddress("");
    creatingRef.current = false;
    resetRegister();
    setSessionStep("creating");
  };

  // --- OUTPUT ---
  if (sessionStep === "output" && outputToken) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-safe/5 border border-safe/15">
          <span className="text-safe text-sm mt-0.5">&#x2713;</span>
          <div>
            <p className="text-xs font-semibold text-safe">Session created</p>
            <p className="text-[11px] text-muted mt-0.5">Copy the access token below. It won&apos;t be shown again.</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-faint font-medium uppercase tracking-wider">Access Token</span>
            <CopyButton value={outputToken} label="Copy" />
          </div>
          <div className="rounded-lg bg-[#0A0A0C] border border-white/[0.06] p-2.5 font-mono text-[10px] text-muted break-all select-all max-h-[60px] overflow-y-auto">
            {outputToken}
          </div>
          <p className="text-[10px] text-warning">This token cannot be recovered. Save it now.</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-faint font-medium uppercase tracking-wider">System Prompt</span>
            <CopyButton value={generateSystemPrompt(walletAddress, outputToken, currentConfig, dailyCap, expiryHours, approvalThreshold, agentName || PRESETS[preset].label)} label="Copy" />
          </div>
          <pre className="rounded-lg bg-[#0A0A0C] border border-white/[0.06] p-2.5 text-[10px] text-zinc-500 overflow-x-auto max-h-[120px] overflow-y-auto whitespace-pre-wrap">
            {generateSystemPrompt(walletAddress, outputToken, currentConfig, dailyCap, expiryHours, approvalThreshold, agentName || PRESETS[preset].label)}
          </pre>
        </div>

        {regHash && (
          <a href={`${MONAD_TESTNET_EXPLORER}/tx/${regHash}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent hover:text-accent-hover">
            View registration tx &#x2192;
          </a>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={() => { onSuccess(); onClose(); }} className="btn btn-primary flex-1 text-xs py-2">Done</button>
          <button onClick={() => { setSessionStep("configure"); setSessionKeyAddress(""); setOutputToken(""); creatingRef.current = false; resetRegister(); }} className="btn btn-ghost flex-1 text-xs py-2">Create Another</button>
        </div>
      </div>
    );
  }

  // --- PROGRESS ---
  if (sessionStep === "creating" || sessionStep === "registering") {
    return (
      <div className="py-8 text-center space-y-3">
        <div className="mx-auto h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center animate-pulse">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent animate-spin">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <p className="text-xs font-medium text-text">
          {sessionStep === "creating" && "Sign to authorize session..."}
          {sessionStep === "registering" && isRegistering && "Confirm registration in wallet..."}
          {sessionStep === "registering" && isRegConfirming && "Registering on-chain..."}
        </p>
        <p className="text-[11px] text-faint">{sessionStep === "creating" ? "Step 1/2" : "Step 2/2"}</p>
        <button onClick={() => { setSessionStep("configure"); creatingRef.current = false; resetRegister(); }} className="text-[11px] text-faint hover:text-muted">Cancel</button>
      </div>
    );
  }

  // --- CONFIGURE ---
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text">New Session</h3>
        <button onClick={onClose} className="text-faint hover:text-muted text-xs">Cancel</button>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 p-2.5">
          <p className="text-[11px] text-danger">{error}</p>
        </div>
      )}

      <div>
        <label className="text-[11px] text-faint block mb-1">Name</label>
        <input type="text" value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder={PRESETS[preset].label} maxLength={32} className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs text-text placeholder:text-faint" />
      </div>

      <div>
        <label className="text-[11px] text-faint block mb-1">Permissions</label>
        <div className="space-y-1.5">
          {(Object.entries(PRESETS) as [AgentPreset, PresetConfig][]).map(([key, cfg]) => (
            <button key={key} onClick={() => setPreset(key)} className={`w-full text-left rounded-lg border px-3 py-2 transition-all ${preset === key ? "border-accent/40 bg-accent/5" : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"}`}>
              <p className={`text-[11px] font-medium ${preset === key ? "text-accent" : "text-text"}`}>{cfg.label}</p>
              <p className="text-[10px] text-faint mt-0.5">{cfg.description}</p>
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="mt-2 space-y-1.5">
            <input value={customTarget} onChange={(e) => setCustomTarget(e.target.value)} placeholder="Target 0x..." className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-text" />
            <input value={customSelectors} onChange={(e) => setCustomSelectors(e.target.value)} placeholder="0xa9059cbb, 0x095ea7b3" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] text-text" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-faint block mb-1">Daily Cap (MON)</label>
          <input type="number" value={dailyCap} onChange={(e) => setDailyCap(e.target.value)} min="0" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-text" />
        </div>
        <div>
          <label className="text-[11px] text-faint block mb-1">Duration (hours)</label>
          <input type="number" value={expiryHours} onChange={(e) => setExpiryHours(e.target.value)} min="1" className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-text" />
        </div>
      </div>

      <button type="button" onClick={() => { if (approvalEnabled) { setApprovalEnabled(false); setApprovalThreshold("0"); } else { setApprovalEnabled(true); if (!approvalThreshold || parseFloat(approvalThreshold) <= 0) setApprovalThreshold("1"); } }} className="flex items-center gap-2 w-full text-left">
        <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-all ${approvalEnabled ? "border-accent bg-accent" : "border-white/[0.16] bg-white/[0.03]"}`}>
          {approvalEnabled && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </span>
        <span className="text-[11px] text-text">Require approval above threshold</span>
      </button>
      {approvalEnabled && (
        <div className="flex items-center gap-2 ml-5">
          <input type="number" value={approvalThreshold} onChange={(e) => setApprovalThreshold(e.target.value)} min="0.1" step="0.1" className="w-20 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[11px] text-text" />
          <span className="text-[10px] text-faint">MON per tx</span>
        </div>
      )}

      <button onClick={handleCreate} className="btn btn-primary w-full py-2 text-xs font-medium">Create Session</button>
      <p className="text-[10px] text-faint text-center">1 signature + 1 transaction</p>
    </div>
  );
}

// --- Main Page ---
export default function WalletDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address: walletAddress } = use(params);
  const { data: balance, refetch: refetchBalance } = useWalletBalance(walletAddress as `0x${string}`);
  const { data: keys, refetch: refetchKeys } = useActiveKeys(walletAddress as `0x${string}`);
  const { freeze, isPending: isFreezing, isSuccess: freezeSuccess } = useFreeze(walletAddress as `0x${string}`);
  const { revoke, isPending: isRevoking, isSuccess: revokeSuccess, reset: resetRevoke } = useRevokeSession(walletAddress as `0x${string}`);
  const { getDisplayName } = useWalletNames();
  const {
    withdraw,
    reset: resetWithdraw,
    hash: withdrawHash,
    isPending: isWithdrawPending,
    isConfirming: isWithdrawConfirming,
    isSuccess: withdrawSuccess,
    isLoading: isWithdrawLoading,
  } = useWithdrawFunds(walletAddress as `0x${string}`);
  const [showWithdrawPanel, setShowWithdrawPanel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const router = useRouter();

  const activeKeys = (keys as `0x${string}`[]) || [];
  const balanceNum = balance ? parseFloat(balance.formatted) : 0;
  const hasBalance = balanceNum > 0;

  // Refetch keys after revoke or freeze
  useEffect(() => {
    if (revokeSuccess || freezeSuccess) {
      const t = setTimeout(() => { refetchKeys(); resetRevoke(); }, 2000);
      return () => clearTimeout(t);
    }
  }, [revokeSuccess, freezeSuccess, refetchKeys, resetRevoke]);

  return (
    <div className="space-y-6">
      <Link href="/wallets" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Back to Wallets
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-text">{getDisplayName(walletAddress)}</h1>
        <p className="mt-0.5 font-mono text-xs text-muted">{walletAddress}</p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <ActionBtn label="Withdraw" onClick={() => setShowWithdrawPanel(true)} disabled={!hasBalance} variant="accent" />
        <ActionBtn label="Freeze All" onClick={() => freeze()} disabled={isFreezing || activeKeys.length === 0} variant="danger" />
        <ActionBtn label="Delete" onClick={() => setShowDeleteConfirm(true)} variant="danger" />
        <a
          href={`${MONAD_TESTNET_EXPLORER}/address/${walletAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-faint hover:text-accent hover:border-accent/20 transition-all ml-auto"
        >
          Explorer
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" /></svg>
        </a>
      </div>

      {/* Withdraw Panel */}
      {showWithdrawPanel && (
        <div className="rounded-xl border border-accent/15 bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-text">Withdraw all funds</p>
            <button onClick={() => { setShowWithdrawPanel(false); resetWithdraw(); }} className="text-faint hover:text-text">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <p className="font-mono text-lg font-semibold text-text">{balanceNum.toFixed(4)} <span className="text-xs text-muted font-normal">MON</span></p>
          {withdrawSuccess && withdrawHash ? (
            <div className="rounded-lg bg-safe/10 border border-safe/20 p-2.5 space-y-1">
              <p className="text-xs text-safe font-medium">Done!</p>
              <a href={`${MONAD_TESTNET_EXPLORER}/tx/${withdrawHash}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-accent">View tx &#x2192;</a>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => withdraw()} disabled={isWithdrawLoading || !hasBalance} className="btn btn-primary flex-1 text-xs py-2">
                {isWithdrawPending ? "Confirm..." : isWithdrawConfirming ? "Processing..." : "Withdraw"}
              </button>
              <button onClick={() => { setShowWithdrawPanel(false); resetWithdraw(); }} className="btn btn-ghost text-xs py-2">Cancel</button>
            </div>
          )}
          {withdrawSuccess && (
            <button onClick={() => { setShowWithdrawPanel(false); resetWithdraw(); refetchBalance(); }} className="btn btn-primary w-full text-xs py-2">Close</button>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="rounded-xl border border-danger/20 bg-white/[0.02] p-4 space-y-3">
          <p className="text-xs font-medium text-danger">Delete this AI Wallet?</p>

          {hasBalance ? (
            <>
              <div className="rounded-lg bg-warning/5 border border-warning/20 p-3 space-y-1">
                <p className="text-[11px] text-warning font-medium">This wallet still has funds</p>
                <p className="text-[10px] text-muted">
                  <span className="font-mono text-text font-semibold">{balanceNum.toFixed(4)} MON</span> will be withdrawn to your connected wallet before removal.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => withdraw()}
                  disabled={isWithdrawLoading}
                  className="btn text-xs bg-danger/10 border-danger/30 text-danger hover:bg-danger/20 flex-1 py-2"
                >
                  {isWithdrawPending ? "Confirm in wallet..." : isWithdrawConfirming ? "Withdrawing..." : "Withdraw & Delete"}
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-ghost text-xs py-2 flex-1">Cancel</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[11px] text-muted">
                No funds remaining. {activeKeys.length > 0 ? "Active sessions will be revoked. " : ""}Removes wallet from your dashboard. On-chain contract persists.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (activeKeys.length > 0) freeze();
                    activeKeys.forEach((key) => removeWalletMeta(key));
                    clearWalletActivity(walletAddress);
                    hideWallet(walletAddress as `0x${string}`);
                    router.push("/wallets");
                  }}
                  disabled={isFreezing}
                  className="btn text-xs bg-danger/10 border-danger/30 text-danger hover:bg-danger/20 flex-1 py-2"
                >
                  {isFreezing ? "Freezing sessions..." : "Delete Wallet"}
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-ghost text-xs py-2 flex-1">Cancel</button>
              </div>
            </>
          )}

          {/* After successful withdrawal from delete flow */}
          {withdrawSuccess && withdrawHash && showDeleteConfirm && (
            <div className="rounded-lg bg-safe/10 border border-safe/20 p-3 space-y-2">
              <p className="text-xs text-safe font-medium">Funds withdrawn successfully</p>
              <a href={`${MONAD_TESTNET_EXPLORER}/tx/${withdrawHash}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent block">View tx &#x2192;</a>
              <button
                onClick={() => {
                  if (activeKeys.length > 0) freeze();
                  activeKeys.forEach((key) => removeWalletMeta(key));
                  clearWalletActivity(walletAddress);
                  hideWallet(walletAddress as `0x${string}`);
                  router.push("/wallets");
                }}
                className="btn text-xs bg-danger/10 border-danger/30 text-danger hover:bg-danger/20 w-full py-2"
              >
                Continue — Remove from Dashboard
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <BorderGlow {...GLOW_PROPS}>
          <div className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-faint">Balance</p>
            <p className="mt-1 font-mono text-xl font-semibold text-text">{balanceNum.toFixed(4)}</p>
            <p className="text-[11px] text-muted">{balance?.symbol || "MON"}</p>
          </div>
        </BorderGlow>
        <BorderGlow {...GLOW_PROPS}>
          <div className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-faint">Sessions</p>
            <p className="mt-1 text-xl font-semibold text-text">{activeKeys.length}</p>
            <p className="text-[11px] text-muted">active</p>
          </div>
        </BorderGlow>
        <BorderGlow {...GLOW_PROPS}>
          <div className="p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-faint">Status</p>
            <p className={`mt-1 text-xl font-semibold ${freezeSuccess ? "text-danger" : activeKeys.length > 0 ? "text-safe" : "text-faint"}`}>
              {freezeSuccess ? "Frozen" : activeKeys.length > 0 ? "Active" : "Idle"}
            </p>
            <p className="text-[11px] text-muted">wallet state</p>
          </div>
        </BorderGlow>
      </div>

      {/* Sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text">Sessions</h2>
          {!showCreateSession && (
            <button onClick={() => setShowCreateSession(true)} className="action-btn action-btn--accent rounded-lg border border-accent/20 px-3 py-1.5 text-[11px] font-medium text-accent hover:bg-accent/10">
              + New Session
            </button>
          )}
        </div>

        {/* Create Session */}
        {showCreateSession && (
          <BorderGlow {...GLOW_PROPS}>
            <div className="p-5 mb-4">
              <CreateSessionPanel walletAddress={walletAddress as `0x${string}`} onClose={() => setShowCreateSession(false)} onSuccess={() => refetchKeys()} />
            </div>
          </BorderGlow>
        )}

        {/* Session list */}
        {activeKeys.length === 0 && !showCreateSession ? (
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-8 text-center">
            <p className="text-xs text-muted">No active sessions.</p>
            <button onClick={() => setShowCreateSession(true)} className="text-[11px] text-accent hover:text-accent-hover mt-2 inline-block">
              Create your first session &#x2192;
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {activeKeys.map((key) => (
              <SessionRow
                key={key}
                walletAddress={walletAddress as `0x${string}`}
                keyAddress={key}
                onRevoke={(k) => revoke(k)}
                isRevoking={isRevoking}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
