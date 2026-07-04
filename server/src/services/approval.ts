import { supabase } from './supabase.js';
import { sendApprovalRequest } from './telegram.js';
import { config } from '../config.js';

const APPROVAL_TIMEOUT_MS = 120_000; // 2 minutes to approve
const POLL_INTERVAL_MS = 1_000; // Check every 1 second

export interface ApprovalRequest {
  agentAddress: string;
  agentName: string;
  vaultAddress: string;
  ownerAddress: string;
  actionType: 'send' | 'call';
  target: string;
  functionName?: string;
  valueMon: string;
  recipient?: string;
  memo?: string;
  fullRequest?: Record<string, unknown>;
}

export type ApprovalDecision = 'approved' | 'rejected' | 'expired';

/**
 * Request approval from the vault owner via Telegram.
 * Sends an inline-keyboard message and polls the DB for the decision.
 * Returns the decision or 'expired' if timeout.
 */
export async function requestApproval(req: ApprovalRequest): Promise<ApprovalDecision> {
  // 1. Get owner's Telegram chat ID
  const { data: notif } = await supabase
    .from('notifications')
    .select('telegram_chat_id, telegram_verified')
    .eq('owner_address', req.ownerAddress.toLowerCase())
    .single();

  if (!notif?.telegram_chat_id || !notif?.telegram_verified) {
    // An approval is required but the owner has no verified approver channel.
    // Fail closed by default (block); opt out with APPROVALS_FAIL_CLOSED=false.
    return config.approvals.failClosed ? 'rejected' : 'approved';
  }

  // 2. Create pending approval record
  const expiresAt = new Date(Date.now() + APPROVAL_TIMEOUT_MS).toISOString();
  const { data: approval, error } = await supabase
    .from('pending_approvals')
    .insert({
      agent_address: req.agentAddress.toLowerCase(),
      vault_address: req.vaultAddress.toLowerCase(),
      owner_address: req.ownerAddress.toLowerCase(),
      agent_name: req.agentName,
      action_type: req.actionType,
      target: req.target,
      function_name: req.functionName || null,
      value_mon: req.valueMon,
      recipient: req.recipient || null,
      memo: req.memo || null,
      full_request: req.fullRequest || null,
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (error || !approval) {
    console.error('[Approval] Failed to create:', error);
    // Could not record the approval request. Fail closed by default.
    return config.approvals.failClosed ? 'rejected' : 'approved';
  }

  const approvalId = approval.id;

  // 3. Send Telegram message with Approve/Reject buttons
  const actionEmoji = req.actionType === 'send' ? '💸' : '📞';
  const message = req.actionType === 'send'
    ? `${actionEmoji} <b>Approval Required</b>\n\n` +
      `<b>${req.agentName}</b> wants to send:\n\n` +
      `Amount: <b>${req.valueMon} MON</b>\n` +
      `To: <code>${req.recipient || req.target}</code>\n` +
      `${req.memo ? `Memo: ${req.memo}\n` : ''}` +
      `\nVault: <code>${req.vaultAddress.slice(0, 10)}...</code>\n\n` +
      `⏱ Expires in 2 minutes`
    : `${actionEmoji} <b>Approval Required</b>\n\n` +
      `<b>${req.agentName}</b> wants to call:\n\n` +
      `Function: <b>${req.functionName}</b>\n` +
      `Target: <code>${req.target.slice(0, 14)}...</code>\n` +
      `Value: <b>${req.valueMon} MON</b>\n\n` +
      `Vault: <code>${req.vaultAddress.slice(0, 10)}...</code>\n\n` +
      `⏱ Expires in 2 minutes`;

  const messageId = await sendApprovalRequest(notif.telegram_chat_id, message, approvalId);

  if (messageId) {
    await supabase
      .from('pending_approvals')
      .update({ telegram_message_id: messageId })
      .eq('id', approvalId);
  }

  // 4. Poll for decision
  const decision = await pollForDecision(approvalId, APPROVAL_TIMEOUT_MS);

  // 5. If expired, mark it
  if (decision === 'expired') {
    await supabase
      .from('pending_approvals')
      .update({ status: 'expired', decided_at: new Date().toISOString() })
      .eq('id', approvalId);
  }

  return decision;
}

/**
 * Poll Supabase for the approval decision.
 */
async function pollForDecision(approvalId: string, timeoutMs: number): Promise<ApprovalDecision> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const { data } = await supabase
      .from('pending_approvals')
      .select('status')
      .eq('id', approvalId)
      .single();

    if (data?.status === 'approved') return 'approved';
    if (data?.status === 'rejected') return 'rejected';

    // Wait before polling again
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  return 'expired';
}

/**
 * Check if a transaction needs approval based on the agent's threshold.
 */
export async function needsApproval(agentAddress: string, valueMon: string): Promise<boolean> {
  const { data: agent } = await supabase
    .from('agents')
    .select('approval_threshold')
    .eq('session_key_address', agentAddress.toLowerCase())
    .single();

  if (!agent?.approval_threshold) return false;

  const threshold = parseFloat(agent.approval_threshold);
  if (threshold <= 0) return false;

  const amount = parseFloat(valueMon);
  return amount > threshold;
}

/**
 * Get the agent's display name from DB.
 */
export async function getAgentName(agentAddress: string): Promise<string> {
  const { data } = await supabase
    .from('agents')
    .select('name')
    .eq('session_key_address', agentAddress.toLowerCase())
    .single();
  return data?.name || `${agentAddress.slice(0, 8)}...`;
}
