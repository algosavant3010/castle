import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase.js';
import { sendTelegramAlert, answerCallbackQuery, editApprovalMessage } from '../services/telegram.js';
import { ownerAuth } from '../middleware/owner-auth.js';
import { config } from '../config.js';

const router = Router();

/**
 * Handle a Telegram update — used by both webhook and local poller.
 */
export async function handleTelegramUpdate(update: Record<string, unknown>): Promise<void> {
  // --- Callback queries (Approve / Reject buttons) ---
  if (update?.callback_query) {
    const cq = update.callback_query as Record<string, unknown>;
    const data = cq.data as string;
    const msg = cq.message as Record<string, unknown> | undefined;
    const chat = msg?.chat as Record<string, unknown> | undefined;
    const chatId = chat?.id?.toString() || '';
    const cqId = cq.id as string;

    if (!data || !chatId) { await answerCallbackQuery(cqId, 'Invalid'); return; }

    const [action, approvalId] = data.split(':');
    if (!approvalId || (action !== 'approve' && action !== 'reject')) { await answerCallbackQuery(cqId, 'Invalid action'); return; }

    const { data: approval } = await supabase.from('pending_approvals').select('*').eq('id', approvalId).single();
    if (!approval) { await answerCallbackQuery(cqId, 'Not found'); return; }
    if (approval.status !== 'pending') { await answerCallbackQuery(cqId, `Already ${approval.status}`); return; }

    // Only the verified owner's chat may decide this approval.
    const { data: ownerNotif } = await supabase
      .from('notifications')
      .select('telegram_chat_id, telegram_verified')
      .eq('owner_address', approval.owner_address.toLowerCase())
      .single();
    if (!ownerNotif?.telegram_verified || ownerNotif.telegram_chat_id !== chatId) {
      await answerCallbackQuery(cqId, 'Not authorized');
      return;
    }

    if (new Date(approval.expires_at) < new Date()) {
      await supabase.from('pending_approvals').update({ status: 'expired', decided_at: new Date().toISOString() }).eq('id', approvalId);
      await answerCallbackQuery(cqId, 'Expired');
      if (approval.telegram_message_id) {
        await editApprovalMessage(chatId, approval.telegram_message_id, `⏱ <b>Expired</b>\n\n${approval.agent_name} — ${approval.value_mon} MON\n<i>Timed out.</i>`);
      }
      return;
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await supabase.from('pending_approvals').update({ status: newStatus, decided_at: new Date().toISOString() }).eq('id', approvalId);

    const emoji = action === 'approve' ? '✅' : '❌';
    const label = action === 'approve' ? 'APPROVED' : 'REJECTED';
    if (approval.telegram_message_id) {
      await editApprovalMessage(chatId, approval.telegram_message_id,
        `${emoji} <b>${label}</b>\n\n<b>${approval.agent_name}</b> — ${approval.value_mon} MON\n${approval.action_type === 'send' ? `To: <code>${approval.recipient}</code>` : `Call: ${approval.function_name}`}\n\n<i>${new Date().toLocaleTimeString()}</i>`
      );
    }
    await answerCallbackQuery(cqId, `${label}!`);
    return;
  }

  // --- Text messages (commands) ---
  const msg = update?.message as Record<string, unknown> | undefined;
  if (!msg) return;
  const text = msg.text as string | undefined;
  if (!text) return;

  const chat = msg.chat as Record<string, unknown>;
  const chatId = chat?.id?.toString() || '';
  const from = msg.from as Record<string, unknown> | undefined;
  const username = from?.username as string | undefined;
  const command = text.split(' ')[0].split('@')[0].toLowerCase();

  switch (command) {
    case '/start':
      await sendTelegramAlert(chatId,
        `👋 Welcome${username ? `, @${username}` : ''}!\n\n` +
        `This is <b>CastleConnect</b> — alerts & approval controls for your AI agents.\n\n` +
        `Your Chat ID: <code>${chatId}</code>\n\n` +
        `Paste this in Castle app settings to link.`
      );
      break;
    case '/id':
      await sendTelegramAlert(chatId, `Your Chat ID: <code>${chatId}</code>`);
      break;
    case '/status': {
      const { data: d } = await supabase.from('notifications').select('owner_address, telegram_verified').eq('telegram_chat_id', chatId).single();
      if (d?.telegram_verified) {
        const { count } = await supabase.from('pending_approvals').select('*', { count: 'exact', head: true }).eq('owner_address', d.owner_address.toLowerCase()).eq('status', 'pending');
        await sendTelegramAlert(chatId, `✅ Linked to: <code>${d.owner_address.slice(0, 10)}...</code>\nPending: ${count || 0}`);
      } else {
        await sendTelegramAlert(chatId, 'Not linked. Add Chat ID in Castle settings.');
      }
      break;
    }
    case '/help':
      await sendTelegramAlert(chatId, `<b>Commands:</b>\n/start — Welcome\n/id — Chat ID\n/status — Link status\n/help — This`);
      break;
  }
}

// Webhook endpoint (production). Telegram echoes the secret token we set on
// setWebhook; reject anything that does not present the matching secret.
router.post('/webhook', async (req: Request, res: Response) => {
  const secret = req.headers['x-telegram-bot-api-secret-token'];
  if (!config.telegram.webhookSecret || secret !== config.telegram.webhookSecret) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  await handleTelegramUpdate(req.body);
  res.json({ ok: true });
});

// OTP verification — links a Telegram chat to an owner address.
// Requires an owner wallet signature (purpose "link-telegram") so nobody can
// link another person's owner address to their own chat.
router.post('/verify', ownerAuth('link-telegram'), async (req: Request, res: Response) => {
  const owner = req.ownerAddress!;
  const { chatId, code } = req.body;
  if (!chatId) return res.status(400).json({ error: 'chatId required.' });

  if (code) {
    const { data: otp } = await supabase.from('telegram_otps')
      .select('*').eq('chat_id', chatId).eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }).limit(1).single();
    if (!otp) return res.status(400).json({ error: 'No valid OTP.' });
    // The OTP must have been issued for this same owner.
    if (otp.owner_address.toLowerCase() !== owner) return res.status(400).json({ error: 'OTP was issued for a different owner.' });
    if (otp.code !== String(code).trim()) return res.status(400).json({ error: 'Wrong code.' });

    await supabase.from('telegram_otps').update({ used: true }).eq('id', otp.id);
    await supabase.from('notifications').upsert({ owner_address: owner, telegram_chat_id: chatId, telegram_verified: true }, { onConflict: 'owner_address' });
    await sendTelegramAlert(chatId, '✅ Verified! You\'ll receive alerts.');
    return res.json({ success: true, verified: true });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  await supabase.from('telegram_otps').insert({ chat_id: chatId, code: otpCode, owner_address: owner, expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() });
  const sent = await sendTelegramAlert(chatId, `Castle code: <code>${otpCode}</code>\nExpires in 5 min.`);
  if (!sent) return res.status(400).json({ error: 'Could not reach Chat ID.' });
  res.json({ success: true, codeSent: true });
});

// Register webhook (production only). Admin-gated and sets the secret token that
// Telegram will echo back on every webhook call.
router.post('/register-webhook', async (req: Request, res: Response) => {
  if (!config.adminSecret || req.headers['x-admin-secret'] !== config.adminSecret) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  if (!config.telegram.webhookSecret) {
    return res.status(400).json({ error: 'TELEGRAM_WEBHOOK_SECRET is not configured.' });
  }
  const url = `${config.publicServerUrl}/api/telegram/webhook`;
  try {
    const r = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/setWebhook`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, secret_token: config.telegram.webhookSecret, allowed_updates: ['message', 'callback_query'] }),
    });
    const d = await r.json() as { ok: boolean; description?: string };
    res.json({ success: d.ok, webhookUrl: url });
  } catch { res.status(500).json({ error: 'Failed.' }); }
});

export default router;
