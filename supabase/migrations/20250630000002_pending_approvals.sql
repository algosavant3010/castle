-- Pending approval requests (agent tx waits for user to approve/reject via Telegram)
CREATE TABLE pending_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_address TEXT NOT NULL,
  vault_address TEXT NOT NULL,
  owner_address TEXT NOT NULL,
  agent_name TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('send', 'call')),
  target TEXT NOT NULL,
  function_name TEXT,
  value_mon TEXT NOT NULL,
  recipient TEXT,
  memo TEXT,
  full_request JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  telegram_message_id TEXT,
  decided_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pending_approvals_status ON pending_approvals(status, expires_at);
CREATE INDEX idx_pending_approvals_agent ON pending_approvals(agent_address, status);
