import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load the single .env.local from the project root (one level up from server/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { globalRateLimiter } from './middleware/rate-limit.js';
import { ipMonitor } from './middleware/ip-monitor.js';
import agentInfoRouter from './routes/agent-info.js';
import agentBalanceRouter from './routes/agent-balance.js';
import agentSendRouter from './routes/agent-send.js';
import agentCallRouter from './routes/agent-call.js';
import agentReadRouter from './routes/agent-read.js';
import agentTxRouter from './routes/agent-tx.js';
import agentClaimRouter from './routes/agent-claim.js';
import agentsRouter from './routes/agents.js';
import telegramRouter, { handleTelegramUpdate } from './routes/telegram.js';
import { startPolling, setUpdateHandler } from './services/telegram-poller.js';
import { config } from './config.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4000');

// Derive req.ip from the correct hop; prevents X-Forwarded-For spoofing when
// TRUST_PROXY_HOPS is set to match your deployment (0 = no proxy).
app.set('trust proxy', config.trustProxy);

app.use(helmet());
// Restrict browser origins to an allowlist. Requests with no Origin header
// (server-to-server agents, curl) are allowed; the per-agent bearer token is
// the real gate for those.
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || config.allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: false,
}));
app.use(express.json({ limit: '100kb' }));
app.use(morgan('[:date[iso]] :method :url :status :response-time ms - :remote-addr'));
app.use(globalRateLimiter);
app.use(ipMonitor);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'blitz-server', timestamp: new Date().toISOString() });
});

app.use('/api/agent/info', agentInfoRouter);
app.use('/api/agent/balance', agentBalanceRouter);
app.use('/api/agent/send', agentSendRouter);
app.use('/api/agent/call', agentCallRouter);
app.use('/api/agent/read', agentReadRouter);
app.use('/api/agent/tx', agentTxRouter);
app.use('/api/agent/claim', agentClaimRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/telegram', telegramRouter);

app.use((_req, res) => { res.status(404).json({ error: 'Not found' }); });
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[Blitz Server] Running on port ${PORT}`);
  console.log(`[Blitz Server] Env: ${config.nodeEnv}`);
  console.log(`[Blitz Server] Supabase: ${process.env.SUPABASE_URL}`);

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (botToken) {
    if (config.nodeEnv === 'production' && config.telegram.webhookSecret) {
      // Production: use webhooks (registered via /api/telegram/register-webhook).
      // Do NOT delete the webhook or start polling.
      console.log('[Telegram] Webhook mode (production). POST /api/telegram/webhook is active.');
    } else {
      // Development: delete any existing webhook and poll for updates.
      fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`)
        .then(() => {
          setUpdateHandler(handleTelegramUpdate);
          startPolling();
        })
        .catch(err => console.error('[Telegram] Failed to init polling:', err));
    }
  }
});

export default app;
