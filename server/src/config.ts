function parseOrigins(raw: string | undefined): string[] {
  if (!raw) return ['http://localhost:3000'];
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

export const config = {
  port: parseInt(process.env.PORT || '4000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  // Number of proxy hops in front of the app (0 = none). Controls how req.ip is
  // derived so X-Forwarded-For cannot be spoofed by clients.
  trustProxy: parseInt(process.env.TRUST_PROXY_HOPS || '0'),
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
  publicServerUrl: process.env.PUBLIC_SERVER_URL || 'http://localhost:4000',
  adminSecret: process.env.ADMIN_SECRET || '',
  supabase: {
    url: process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },
  monad: {
    rpc: process.env.MONAD_RPC || 'https://testnet-rpc.monad.xyz',
    chainId: 10143,
  },
  encryption: {
    masterKey: process.env.ENCRYPTION_MASTER_KEY || '',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    // Secret token verified on every inbound webhook call (set on setWebhook).
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  },
  approvals: {
    // When an approval is required but the owner has no verified Telegram link,
    // block the transaction (fail closed) instead of silently allowing it.
    failClosed: (process.env.APPROVALS_FAIL_CLOSED || 'true').toLowerCase() !== 'false',
  },
  contracts: {
    factory: (process.env.FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    escrow: (process.env.ESCROW_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    paymentRouter: (process.env.PAYMENT_ROUTER_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  },
  rateLimits: {
    globalPerMinute: 120,
    agentPerMinute: 60,
    patternWindowMs: 5 * 60 * 1000,
    maxRepeatedCalls: 5,
  },
};
