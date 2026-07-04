import { Router, Request, Response } from 'express';
import { parseEther, encodeFunctionData, isAddress, formatEther } from 'viem';
import { authMiddleware } from '../middleware/auth.js';
import { agentRateLimiter } from '../middleware/rate-limit.js';
import { checkNewIp } from '../middleware/ip-monitor.js';
import { checkSigningPattern } from '../middleware/pattern-detect.js';
import { logRequest } from '../middleware/logger.js';
import { validateAmount, validateMemo } from '../middleware/validate.js';
import { publicClient, createAgentWalletClient } from '../services/chain.js';
import { supabase } from '../services/supabase.js';
import { alertOnSend, alertBudgetWarning } from '../services/telegram.js';
import { needsApproval, requestApproval, getAgentName } from '../services/approval.js';
import { BlitzWalletABI } from '../abis/BlitzWallet.js';
import { BlitzPaymentRouterABI } from '../abis/BlitzPaymentRouter.js';
import { config } from '../config.js';

const router = Router();

router.post('/', authMiddleware, agentRateLimiter, async (req: Request, res: Response) => {
  const start = Date.now();
  const creds = req.agentCredentials!;
  checkNewIp(req);

  const { to, amount, memo } = req.body;
  if (!to || !isAddress(to)) { res.status(400).json({ error: "Invalid 'to' address." }); logRequest(req, res, Date.now() - start); return; }
  if (!amount) { res.status(400).json({ error: "Missing 'amount'." }); logRequest(req, res, Date.now() - start); return; }
  const amtErr = validateAmount(amount); if (amtErr) { res.status(400).json({ error: amtErr }); logRequest(req, res, Date.now() - start); return; }
  const memoErr = validateMemo(memo); if (memoErr) { res.status(400).json({ error: memoErr }); logRequest(req, res, Date.now() - start); return; }
  if (to.toLowerCase() === creds.vaultAddress.toLowerCase()) { res.status(400).json({ error: 'Cannot send to own vault.' }); logRequest(req, res, Date.now() - start); return; }

  // Pattern detection
  const pattern = await checkSigningPattern(creds.agentAddress, creds.ownerAddress, config.contracts.paymentRouter, 'send', amount);
  if (pattern.blocked) { res.status(429).json({ error: pattern.reason }); logRequest(req, res, Date.now() - start); return; }

  // --- APPROVAL CHECK ---
  const requiresApproval = await needsApproval(creds.agentAddress, amount);
  if (requiresApproval) {
    const agentName = await getAgentName(creds.agentAddress);
    const decision = await requestApproval({
      agentAddress: creds.agentAddress,
      agentName,
      vaultAddress: creds.vaultAddress,
      ownerAddress: creds.ownerAddress,
      actionType: 'send',
      target: config.contracts.paymentRouter,
      functionName: 'send',
      valueMon: amount,
      recipient: to,
      memo,
      fullRequest: { to, amount, memo },
    });

    if (decision === 'rejected') {
      res.status(403).json({ error: 'Transaction rejected by wallet owner via Telegram.' });
      logRequest(req, res, Date.now() - start);
      return;
    }
    if (decision === 'expired') {
      res.status(408).json({ error: 'Approval request timed out (2 minutes). Owner did not respond.' });
      logRequest(req, res, Date.now() - start);
      return;
    }
    // decision === 'approved' — continue execution
  }

  try {
    const value = parseEther(amount);
    const target = config.contracts.paymentRouter;
    const calldata = memo
      ? encodeFunctionData({ abi: BlitzPaymentRouterABI, functionName: 'sendWithMemo', args: [to as `0x${string}`, memo] })
      : encodeFunctionData({ abi: BlitzPaymentRouterABI, functionName: 'send', args: [to as `0x${string}`] });

    // Log intent
    await supabase.from('transactions').insert({
      agent_address: creds.agentAddress.toLowerCase(), vault_address: creds.vaultAddress.toLowerCase(),
      target, function_name: memo ? 'sendWithMemo' : 'send', value_mon: amount, memo: memo || null,
      ip_address: req.clientMeta?.ip, origin: req.clientMeta?.origin,
    });

    // Execute directly on-chain (policy enforced by BlitzWallet contract)
    const walletClient = createAgentWalletClient(creds.privateKey);
    const hash = await walletClient.writeContract({
      address: creds.vaultAddress, abi: BlitzWalletABI, functionName: 'executeAsAgent',
      args: [target, value, calldata as `0x${string}`],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    await supabase.from('transactions')
      .update({ tx_hash: hash, executed: true, execution_success: receipt.status === 'success', block_number: Number(receipt.blockNumber), gas_used: receipt.gasUsed.toString() })
      .eq('agent_address', creds.agentAddress.toLowerCase()).eq('executed', false)
      .order('created_at', { ascending: false }).limit(1);

    // Telegram post-execution alert (for below-threshold or already-approved txs)
    if (creds.ownerAddress && !requiresApproval) {
      const { data: notif } = await supabase.from('notifications')
        .select('telegram_chat_id, notify_on_send, telegram_verified')
        .eq('owner_address', creds.ownerAddress.toLowerCase()).single();
      if (notif?.telegram_chat_id && notif?.telegram_verified && notif?.notify_on_send) {
        alertOnSend(notif.telegram_chat_id, { agent: creds.agentAddress, to, amount, ip: req.clientMeta?.ip || 'unknown', origin: req.clientMeta?.origin || 'unknown' });
      }
    }

    // Budget warning at 80%
    if (creds.ownerAddress) {
      const policy = await publicClient.readContract({ address: creds.vaultAddress, abi: BlitzWalletABI, functionName: 'getSessionPolicy', args: [creds.agentAddress] }) as [bigint, bigint, bigint, bigint, `0x${string}`, `0x${string}`[], boolean];
      const [, dailyCap, spentToday] = policy;
      const percent = dailyCap > 0n ? Number((spentToday * 100n) / dailyCap) : 0;
      if (percent >= 80) {
        const { data: notif } = await supabase.from('notifications')
          .select('telegram_chat_id, telegram_verified')
          .eq('owner_address', creds.ownerAddress.toLowerCase()).single();
        if (notif?.telegram_chat_id && notif?.telegram_verified) {
          alertBudgetWarning(notif.telegram_chat_id, { agent: creds.agentAddress, spent: formatEther(spentToday), cap: formatEther(dailyCap), percent });
        }
      }
    }

    res.json({ success: receipt.status === 'success', hash, to, amount, memo: memo || null, blockNumber: Number(receipt.blockNumber), gasUsed: receipt.gasUsed.toString() });
    logRequest(req, res, Date.now() - start);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    let status = 500; let error = 'Transaction failed';
    if (message.includes('key not active')) { status = 403; error = 'Session key is frozen.'; }
    else if (message.includes('key expired')) { status = 403; error = 'Session key has expired.'; }
    else if (message.includes('daily cap exceeded')) { status = 403; error = 'Daily cap exceeded.'; }
    else if (message.includes('insufficient funds')) { status = 400; error = 'Insufficient vault balance.'; }
    console.error('[agent-send]', message);
    res.status(status).json({ error });
    logRequest(req, res, Date.now() - start);
  }
});

export default router;
