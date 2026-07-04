import { Router, Request, Response } from 'express';
import { encodeFunctionData, parseEther, isAddress } from 'viem';
import { authMiddleware } from '../middleware/auth.js';
import { agentRateLimiter } from '../middleware/rate-limit.js';
import { checkNewIp } from '../middleware/ip-monitor.js';
import { checkSigningPattern } from '../middleware/pattern-detect.js';
import { logRequest } from '../middleware/logger.js';
import { validateAbi, validateFunctionName } from '../middleware/validate.js';
import { publicClient, createAgentWalletClient } from '../services/chain.js';
import { supabase } from '../services/supabase.js';
import { alertOnCall, sendTelegramAlert } from '../services/telegram.js';
import { needsApproval, requestApproval, getAgentName } from '../services/approval.js';
import { analyzeContractCall, buildThreatAlert } from '../services/threat-analysis.js';
import { BlitzWalletABI } from '../abis/BlitzWallet.js';

const router = Router();

router.post('/', authMiddleware, agentRateLimiter, async (req: Request, res: Response) => {
  const start = Date.now();
  const creds = req.agentCredentials!;
  checkNewIp(req);

  const { target, abi, functionName, args, value } = req.body;
  if (!target || !isAddress(target)) { res.status(400).json({ error: "Invalid 'target'." }); logRequest(req, res, Date.now() - start); return; }
  if (!abi || !Array.isArray(abi) || abi.length === 0) { res.status(400).json({ error: "Invalid 'abi'." }); logRequest(req, res, Date.now() - start); return; }
  const abiErr = validateAbi(abi); if (abiErr) { res.status(400).json({ error: abiErr }); logRequest(req, res, Date.now() - start); return; }
  if (!functionName || typeof functionName !== 'string') { res.status(400).json({ error: "Invalid 'functionName'." }); logRequest(req, res, Date.now() - start); return; }
  const fnErr = validateFunctionName(functionName); if (fnErr) { res.status(400).json({ error: fnErr }); logRequest(req, res, Date.now() - start); return; }
  if (args !== undefined && !Array.isArray(args)) { res.status(400).json({ error: "'args' must be array." }); logRequest(req, res, Date.now() - start); return; }

  const txValue = value ? parseEther(value) : 0n;
  const valueMon = value || '0';

  // Pattern detection
  const pattern = await checkSigningPattern(creds.agentAddress, creds.ownerAddress, target, functionName, valueMon);
  if (pattern.blocked) { res.status(429).json({ error: pattern.reason }); logRequest(req, res, Date.now() - start); return; }

  // --- THREAT ANALYSIS (for non-Blitz contracts) ---
  const calldata = encodeFunctionData({ abi, functionName, args: (args || []) as readonly unknown[] });

  const threat = analyzeContractCall({
    target,
    functionName,
    args: (args || []) as unknown[],
    value: valueMon,
    calldata: calldata as string,
    agentAddress: creds.agentAddress,
    vaultAddress: creds.vaultAddress,
  });

  // Alert owner on any warning or danger
  if (threat.level !== 'safe' && creds.ownerAddress) {
    const agentName = await getAgentName(creds.agentAddress);
    const { data: notif } = await supabase.from('notifications')
      .select('telegram_chat_id, telegram_verified')
      .eq('owner_address', creds.ownerAddress.toLowerCase()).single();
    if (notif?.telegram_chat_id && notif?.telegram_verified) {
      const alertMsg = buildThreatAlert({
        agentName,
        agentAddress: creds.agentAddress,
        vaultAddress: creds.vaultAddress,
        target,
        functionName,
        value: valueMon,
        threat,
      });
      await sendTelegramAlert(notif.telegram_chat_id, alertMsg);
    }
  }

  // Block dangerous calls
  if (threat.shouldBlock) {
    await supabase.from('transactions').insert({
      agent_address: creds.agentAddress.toLowerCase(), vault_address: creds.vaultAddress.toLowerCase(),
      target, function_name: functionName, value_mon: valueMon,
      ip_address: req.clientMeta?.ip, origin: req.clientMeta?.origin,
      executed: false, execution_success: false,
      simulation_error: `BLOCKED: ${threat.summary}`,
    });
    res.status(403).json({
      error: 'Transaction blocked by threat analysis.',
      threat: { level: threat.level, flags: threat.flags, summary: threat.summary },
    });
    logRequest(req, res, Date.now() - start);
    return;
  }

  // --- APPROVAL CHECK ---
  const requiresApproval = await needsApproval(creds.agentAddress, valueMon);
  if (requiresApproval) {
    const agentName = await getAgentName(creds.agentAddress);
    const decision = await requestApproval({
      agentAddress: creds.agentAddress,
      agentName,
      vaultAddress: creds.vaultAddress,
      ownerAddress: creds.ownerAddress,
      actionType: 'call',
      target,
      functionName,
      valueMon,
      fullRequest: { target, functionName, args, value },
    });

    if (decision === 'rejected') {
      res.status(403).json({ error: 'Transaction rejected by wallet owner via Telegram.' });
      logRequest(req, res, Date.now() - start);
      return;
    }
    if (decision === 'expired') {
      res.status(408).json({ error: 'Approval timed out (2 minutes). Owner did not respond.' });
      logRequest(req, res, Date.now() - start);
      return;
    }
  }

  try {
    // Log intent
    await supabase.from('transactions').insert({
      agent_address: creds.agentAddress.toLowerCase(), vault_address: creds.vaultAddress.toLowerCase(),
      target, function_name: functionName, value_mon: valueMon,
      ip_address: req.clientMeta?.ip, origin: req.clientMeta?.origin,
    });

    // Execute directly on-chain (policy enforced by BlitzWallet contract)
    const walletClient = createAgentWalletClient(creds.privateKey);
    const hash = await walletClient.writeContract({
      address: creds.vaultAddress, abi: BlitzWalletABI, functionName: 'executeAsAgent',
      args: [target as `0x${string}`, txValue, calldata as `0x${string}`],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    await supabase.from('transactions')
      .update({ tx_hash: hash, executed: true, execution_success: receipt.status === 'success', block_number: Number(receipt.blockNumber), gas_used: receipt.gasUsed.toString() })
      .eq('agent_address', creds.agentAddress.toLowerCase()).eq('executed', false)
      .order('created_at', { ascending: false }).limit(1);

    // Post-execution alert (only if wasn't already approval-gated)
    if (creds.ownerAddress && !requiresApproval) {
      const { data: notif } = await supabase.from('notifications')
        .select('telegram_chat_id, notify_on_call, telegram_verified')
        .eq('owner_address', creds.ownerAddress.toLowerCase()).single();
      if (notif?.telegram_chat_id && notif?.telegram_verified && notif?.notify_on_call) {
        alertOnCall(notif.telegram_chat_id, { agent: creds.agentAddress, target, fn: functionName, value: valueMon, ip: req.clientMeta?.ip || 'unknown' });
      }
    }

    res.json({ success: receipt.status === 'success', hash, target, functionName, value: valueMon, blockNumber: Number(receipt.blockNumber), gasUsed: receipt.gasUsed.toString() });
    logRequest(req, res, Date.now() - start);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    let status = 500; let error = 'Contract call failed';
    if (message.includes('key not active')) { status = 403; error = 'Session key is frozen.'; }
    else if (message.includes('key expired')) { status = 403; error = 'Session key has expired.'; }
    else if (message.includes('daily cap exceeded')) { status = 403; error = 'Daily cap exceeded.'; }
    console.error('[agent-call]', message);
    res.status(status).json({ error });
    logRequest(req, res, Date.now() - start);
  }
});

export default router;
