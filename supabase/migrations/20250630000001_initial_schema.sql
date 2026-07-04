-- ============================================================
-- Blitz: Initial Schema
-- AI Agent Wallet Infrastructure on Monad
-- ============================================================

-- Vaults deployed by users (1 vault per agent)
CREATE TABLE vaults (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  owner_address TEXT NOT NULL,
  agent_name TEXT,
  chain_id INTEGER DEFAULT 10143,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vaults_owner ON vaults(owner_address);

-- Agent sessions (replaces localStorage agent-store)
CREATE TABLE agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_address TEXT NOT NULL REFERENCES vaults(address) ON DELETE CASCADE,
  session_key_address TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  preset TEXT CHECK (preset IN ('marketplace', 'payments', 'custom')),
  daily_cap TEXT NOT NULL,
  approval_threshold TEXT DEFAULT '0',
  expiry_hours TEXT NOT NULL,
  allowed_target TEXT,
  allowed_functions TEXT[],
  icon TEXT,
  owner_address TEXT NOT NULL,
  encrypted_private_key TEXT,
  encryption_iv TEXT,
  access_token_hash TEXT,
  token_shown BOOLEAN DEFAULT FALSE,
  token_shown_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'expired', 'revoked')),
  frozen_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_owner ON agents(owner_address);
CREATE INDEX idx_agents_vault ON agents(vault_address);
CREATE INDEX idx_agents_token_hash ON agents(access_token_hash);

-- Request logs for monitoring
CREATE TABLE request_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_address TEXT NOT NULL,
  vault_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  origin TEXT,
  referer TEXT,
  body_preview TEXT,
  response_status INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_request_logs_agent ON request_logs(agent_address, created_at DESC);
CREATE INDEX idx_request_logs_ip ON request_logs(ip_address, agent_address);
CREATE INDEX idx_request_logs_created ON request_logs(created_at DESC);

-- Transaction history with simulation
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_address TEXT NOT NULL,
  vault_address TEXT NOT NULL,
  tx_hash TEXT,
  target TEXT NOT NULL,
  function_name TEXT,
  value_mon TEXT DEFAULT '0',
  memo TEXT,
  simulated BOOLEAN DEFAULT FALSE,
  simulation_success BOOLEAN,
  simulation_error TEXT,
  simulation_gas_estimate TEXT,
  executed BOOLEAN DEFAULT FALSE,
  execution_success BOOLEAN,
  block_number BIGINT,
  gas_used TEXT,
  ip_address TEXT,
  origin TEXT,
  flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_agent ON transactions(agent_address, created_at DESC);
CREATE INDEX idx_transactions_vault ON transactions(vault_address, created_at DESC);
CREATE INDEX idx_transactions_hash ON transactions(tx_hash);

-- Notification preferences
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_address TEXT NOT NULL UNIQUE,
  telegram_chat_id TEXT,
  telegram_verified BOOLEAN DEFAULT FALSE,
  notify_on_send BOOLEAN DEFAULT TRUE,
  notify_on_call BOOLEAN DEFAULT TRUE,
  notify_on_freeze BOOLEAN DEFAULT TRUE,
  notify_on_budget_80 BOOLEAN DEFAULT TRUE,
  notify_on_new_ip BOOLEAN DEFAULT TRUE,
  notify_on_pattern BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy templates
CREATE TABLE policy_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_address TEXT NOT NULL,
  name TEXT NOT NULL,
  expiry_hours TEXT NOT NULL,
  daily_cap TEXT NOT NULL,
  allowed_target TEXT,
  allowed_functions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_policy_templates_owner ON policy_templates(owner_address);

-- Pattern detection
CREATE TABLE signing_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_address TEXT NOT NULL,
  target TEXT NOT NULL,
  function_name TEXT NOT NULL,
  value_mon TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  flagged BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_signing_patterns_agent ON signing_patterns(agent_address, target, function_name, value_mon);

-- Telegram OTP store
CREATE TABLE telegram_otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT NOT NULL,
  code TEXT NOT NULL,
  owner_address TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telegram_otps_chat ON telegram_otps(chat_id, used);

-- Known IPs per agent
CREATE TABLE known_ips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_address TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  request_count INTEGER DEFAULT 1,
  UNIQUE(agent_address, ip_address)
);

CREATE INDEX idx_known_ips_agent ON known_ips(agent_address);

-- Auto-update triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vaults_updated_at BEFORE UPDATE ON vaults
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
