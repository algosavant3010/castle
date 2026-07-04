import { config } from '../config.js';

/**
 * Threat Analysis Service
 *
 * Analyzes contract interactions for scam/malicious patterns BEFORE execution.
 * Flags suspicious calls and alerts the wallet owner via Telegram.
 * This replaces the old local simulation — instead of dry-running the tx,
 * we analyze the INTENT of the call for known attack vectors.
 */

export type ThreatLevel = 'safe' | 'warning' | 'danger';

export interface ThreatResult {
  level: ThreatLevel;
  flags: string[];
  summary: string;
  shouldBlock: boolean;
}

// --- Known dangerous function signatures ---
const DANGEROUS_SELECTORS: Record<string, { name: string; risk: string }> = {
  '0x095ea7b3': { name: 'approve', risk: 'Grants spending permission on your tokens to another address' },
  '0xa22cb465': { name: 'setApprovalForAll', risk: 'Grants FULL control of all NFTs in a collection to another address' },
  '0x42842e0e': { name: 'safeTransferFrom', risk: 'Transfers an NFT to another address' },
  '0x23b872dd': { name: 'transferFrom', risk: 'Transfers tokens from one address to another (requires prior approval)' },
  '0xf2fde38b': { name: 'transferOwnership', risk: 'Transfers contract ownership — IRREVERSIBLE' },
  '0x715018a6': { name: 'renounceOwnership', risk: 'Permanently removes ownership — IRREVERSIBLE' },
  '0x3ccfd60b': { name: 'withdraw', risk: 'Withdraws funds from a contract' },
  '0x00f714ce': { name: 'withdraw(uint256,address)', risk: 'Withdraws specific amount to an address' },
  '0xe8eda9df': { name: 'flashLoan', risk: 'Initiates a flash loan — advanced DeFi operation' },
  '0x5c11d795': { name: 'swapExactTokensForTokensSupportingFeeOnTransferTokens', risk: 'DEX swap with fee-on-transfer token support — often used in honeypot tokens' },
};

// Function names that are always suspicious regardless of selector
const SUSPICIOUS_FUNCTION_NAMES = [
  'approve',
  'setApprovalForAll',
  'transferOwnership',
  'renounceOwnership',
  'delegateCall',
  'selfDestruct',
  'multicall',
  'execute',
  'swap',
];

// Unlimited approval value (type(uint256).max)
const UNLIMITED_APPROVAL = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

// Known Blitz protocol contracts (safe targets)
function isBlitzContract(target: string): boolean {
  const blitz = [
    config.contracts.factory.toLowerCase(),
    config.contracts.escrow.toLowerCase(),
    config.contracts.paymentRouter.toLowerCase(),
  ];
  return blitz.includes(target.toLowerCase());
}

/**
 * Analyze a contract call for potential threats.
 * Returns a ThreatResult indicating the risk level and any flags.
 */
export function analyzeContractCall(params: {
  target: string;
  functionName: string;
  args: unknown[];
  value: string;
  calldata?: string;
  agentAddress: string;
  vaultAddress: string;
}): ThreatResult {
  const { target, functionName, args, value, calldata, agentAddress, vaultAddress } = params;
  const flags: string[] = [];
  let level: ThreatLevel = 'safe';

  // 1. Blitz contracts are always safe
  if (isBlitzContract(target)) {
    return { level: 'safe', flags: [], summary: 'Blitz protocol contract — trusted.', shouldBlock: false };
  }

  // 2. Check function name against suspicious list
  const fnLower = functionName.toLowerCase();
  if (SUSPICIOUS_FUNCTION_NAMES.some(s => fnLower.includes(s.toLowerCase()))) {
    flags.push(`Suspicious function: ${functionName}`);
    level = 'warning';
  }

  // 3. Check for approval patterns
  if (fnLower === 'approve' || fnLower === 'setapprovalforall') {
    flags.push(`Token approval detected: ${functionName} — grants spending power to a third party`);
    level = 'danger';

    // Check if it's an unlimited approval
    if (args.length >= 2) {
      const amountArg = String(args[1] || '');
      if (amountArg.toLowerCase().includes(UNLIMITED_APPROVAL) || amountArg === 'type(uint256).max') {
        flags.push('UNLIMITED approval amount — extremely dangerous, gives permanent unlimited access');
        level = 'danger';
      }
    }
  }

  // 4. Check for ownership transfer
  if (fnLower.includes('transferownership') || fnLower.includes('renounceownership')) {
    flags.push(`Ownership operation: ${functionName} — this is IRREVERSIBLE`);
    level = 'danger';
  }

  // 5. Check if sending large value to unknown contract
  const valueMon = parseFloat(value || '0');
  if (valueMon > 0 && !isBlitzContract(target)) {
    if (valueMon > 5) {
      flags.push(`Sending ${value} MON to unknown contract ${target.slice(0, 10)}...`);
      level = level === 'danger' ? 'danger' : 'warning';
    }
  }

  // 6. Check for self-referential calls (target == vault or agent)
  if (target.toLowerCase() === vaultAddress.toLowerCase()) {
    flags.push('Target is your own vault — could be a re-entrancy or self-drain attempt');
    level = 'danger';
  }

  // 7. Check calldata for known dangerous selectors
  if (calldata && calldata.length >= 10) {
    const selector = calldata.slice(0, 10).toLowerCase();
    const known = DANGEROUS_SELECTORS[selector];
    if (known && !flags.some(f => f.includes(known.name))) {
      flags.push(`${known.name}: ${known.risk}`);
      level = level === 'danger' ? 'danger' : 'warning';
    }
  }

  // 8. Check for multicall / batch operations (could hide malicious sub-calls)
  if (fnLower === 'multicall' || fnLower === 'execute' || fnLower === 'batch') {
    flags.push(`Batch/multicall operation — contains multiple sub-transactions that cannot be individually verified`);
    level = 'danger';
  }

  // 9. Determine if we should block
  const shouldBlock = level === 'danger';

  // Build summary
  let summary: string;
  if (level === 'safe') {
    summary = `Call to ${functionName} on ${target.slice(0, 10)}... — no known threats detected.`;
  } else if (level === 'warning') {
    summary = `⚠️ Elevated risk: ${flags[0]}`;
  } else {
    summary = `🚨 DANGEROUS: ${flags[0]}`;
  }

  return { level, flags, summary, shouldBlock };
}

/**
 * Build a Telegram alert message for a detected threat.
 */
export function buildThreatAlert(params: {
  agentName: string;
  agentAddress: string;
  vaultAddress: string;
  target: string;
  functionName: string;
  value: string;
  threat: ThreatResult;
}): string {
  const { agentName, agentAddress, vaultAddress, target, functionName, value, threat } = params;
  const emoji = threat.level === 'danger' ? '🚨' : '⚠️';
  const label = threat.level === 'danger' ? 'SCAM/THREAT DETECTED' : 'SUSPICIOUS ACTIVITY';

  let msg = `${emoji} <b>${label}</b>\n\n`;
  msg += `<b>${agentName}</b> attempted:\n\n`;
  msg += `Function: <b>${functionName}</b>\n`;
  msg += `Target: <code>${target}</code>\n`;
  msg += `Value: <b>${value} MON</b>\n`;
  msg += `Vault: <code>${vaultAddress.slice(0, 10)}...</code>\n\n`;
  msg += `<b>Flags:</b>\n`;
  for (const flag of threat.flags) {
    msg += `• ${flag}\n`;
  }
  msg += `\n<b>Action:</b> ${threat.shouldBlock ? 'BLOCKED automatically.' : 'Allowed but flagged — monitor closely.'}`;
  msg += `\n\n💡 If unexpected, freeze the agent from the Blitz dashboard.`;

  return msg;
}
