-- Deleted wallets (soft-delete, hidden from UI but tracked)
CREATE TABLE deleted_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_address TEXT NOT NULL,
  owner_address TEXT NOT NULL,
  wallet_name TEXT,
  balance_at_deletion TEXT DEFAULT '0',
  deleted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deleted_wallets_owner ON deleted_wallets(owner_address);

-- Grant access
GRANT ALL ON public.deleted_wallets TO service_role;
GRANT SELECT, INSERT ON public.deleted_wallets TO anon;
ALTER TABLE deleted_wallets DISABLE ROW LEVEL SECURITY;
