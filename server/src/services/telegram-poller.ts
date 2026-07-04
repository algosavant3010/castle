/**
 * Telegram Long Polling for local development.
 * In production, you'd use webhooks. Locally, Telegram can't reach localhost,
 * so we poll for updates every 2 seconds.
 */
import { config } from '../config.js';

const TELEGRAM_API = `https://api.telegram.org/bot${config.telegram.botToken}`;
let pollingOffset = 0;
let isPolling = false;

type UpdateHandler = (update: Record<string, unknown>) => Promise<void>;
let handler: UpdateHandler | null = null;

export function setUpdateHandler(fn: UpdateHandler) {
  handler = fn;
}

export function startPolling() {
  if (!config.telegram.botToken) {
    console.log('[Telegram] No bot token, skipping polling.');
    return;
  }
  if (isPolling) return;
  isPolling = true;
  console.log('[Telegram] Polling started (local dev mode)');
  poll();
}

async function poll() {
  while (isPolling) {
    try {
      const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${pollingOffset}&timeout=10&allowed_updates=["message","callback_query"]`);
      const data = await res.json() as { ok: boolean; result?: Array<{ update_id: number } & Record<string, unknown>> };

      if (data.ok && data.result && data.result.length > 0) {
        for (const update of data.result) {
          pollingOffset = update.update_id + 1;
          if (handler) {
            try {
              await handler(update);
            } catch (err) {
              console.error('[Telegram] Handler error:', err);
            }
          }
        }
      }
    } catch (err) {
      console.error('[Telegram] Poll error:', err);
      // Wait before retrying on error
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

export function stopPolling() {
  isPolling = false;
}
