import { config } from '../config.js';

const TELEGRAM_API = `https://api.telegram.org/bot${config.telegram.botToken}`;

interface InlineButton {
  text: string;
  callback_data: string;
}

/**
 * Send a plain text message to a Telegram chat.
 */
export async function sendTelegramAlert(chatId: string, message: string): Promise<boolean> {
  if (!config.telegram.botToken) return false;
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
    const data = await res.json() as { ok: boolean };
    return data.ok === true;
  } catch (err) {
    console.error('[Telegram] Alert failed:', err);
    return false;
  }
}

/**
 * Send a message with inline keyboard buttons (Approve / Reject).
 * Returns the message_id so we can edit it later.
 */
export async function sendApprovalRequest(chatId: string, message: string, approvalId: string): Promise<string | null> {
  if (!config.telegram.botToken) return null;

  const buttons: InlineButton[][] = [
    [
      { text: '✅ Approve', callback_data: `approve:${approvalId}` },
      { text: '❌ Reject', callback_data: `reject:${approvalId}` },
    ],
  ];

  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons },
      }),
    });
    const data = await res.json() as { ok: boolean; result?: { message_id: number } };
    if (data.ok && data.result) {
      return data.result.message_id.toString();
    }
    return null;
  } catch (err) {
    console.error('[Telegram] Approval request failed:', err);
    return null;
  }
}

/**
 * Edit a message to remove buttons and show the decision.
 */
export async function editApprovalMessage(chatId: string, messageId: string, newText: string): Promise<void> {
  if (!config.telegram.botToken) return;
  try {
    await fetch(`${TELEGRAM_API}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: parseInt(messageId),
        text: newText,
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    console.error('[Telegram] Edit message failed:', err);
  }
}

/**
 * Answer a callback query (removes the "loading" state on the button).
 */
export async function answerCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
  if (!config.telegram.botToken) return;
  try {
    await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch (err) {
    console.error('[Telegram] Answer callback failed:', err);
  }
}

// --- Alert helpers ---

export async function alertOnSend(chatId: string, data: { agent: string; to: string; amount: string; ip: string; origin: string }) {
  await sendTelegramAlert(chatId,
    `💸 <b>Agent Send Executed</b>\n\nAgent: <code>${data.agent.slice(0, 10)}...</code>\nTo: <code>${data.to}</code>\nAmount: ${data.amount} MON\nIP: <code>${data.ip}</code>\nOrigin: ${data.origin}`
  );
}

export async function alertOnCall(chatId: string, data: { agent: string; target: string; fn: string; value: string; ip: string }) {
  await sendTelegramAlert(chatId,
    `📞 <b>Agent Call Executed</b>\n\nAgent: <code>${data.agent.slice(0, 10)}...</code>\nTarget: <code>${data.target.slice(0, 10)}...</code>\nFunction: ${data.fn}\nValue: ${data.value} MON\nIP: <code>${data.ip}</code>`
  );
}

export async function alertBudgetWarning(chatId: string, data: { agent: string; spent: string; cap: string; percent: number }) {
  await sendTelegramAlert(chatId,
    `⚠️ <b>Budget ${data.percent}% Used</b>\n\nAgent: <code>${data.agent.slice(0, 10)}...</code>\nSpent: ${data.spent} / ${data.cap} MON`
  );
}

export async function alertNewIp(chatId: string, data: { agent: string; ip: string; origin: string }) {
  await sendTelegramAlert(chatId,
    `🆕 <b>New IP Detected</b>\n\nAgent: <code>${data.agent.slice(0, 10)}...</code>\nIP: <code>${data.ip}</code>\nOrigin: ${data.origin}\n\nIf unexpected, freeze the agent immediately.`
  );
}

export async function alertPatternDetected(chatId: string, data: { agent: string; pattern: string; count: number }) {
  await sendTelegramAlert(chatId,
    `🔴 <b>Repeated Pattern</b>\n\nAgent: <code>${data.agent.slice(0, 10)}...</code>\nPattern: ${data.pattern}\nCount: ${data.count}x in 5 min\n\nRate limited automatically.`
  );
}
