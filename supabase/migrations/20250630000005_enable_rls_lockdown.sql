-- ============================================================
-- Blitz: RLS Lockdown (security hardening)
-- ============================================================
-- The frontend reads all product data directly from the chain (via wagmi)
-- and performs all database writes through the Express server, which uses the
-- service_role key. service_role BYPASSES row-level security, so enabling RLS
-- with no anon policies is a full lockdown that does NOT restrict legitimate use.
--
-- This migration:
--   1. Enables RLS on every table.
--   2. Revokes all privileges from the public `anon` and `authenticated` roles
--      (the anon key is shipped to the browser and must not be able to read or
--      write these tables directly).
--   3. Ensures `service_role` retains full access (used only by the server).
-- ============================================================

-- 1. Enable RLS on every table -------------------------------------------------
ALTER TABLE vaults              ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_templates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_patterns    ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_otps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE known_ips           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_approvals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_wallets     ENABLE ROW LEVEL SECURITY;

-- 2. Revoke every privilege from the public browser roles ----------------------
-- With RLS enabled and no policies granted to these roles, all of their
-- read/write attempts are denied. The public anon key becomes inert if leaked.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL ROUTINES  IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES  IN SCHEMA public FROM authenticated;

-- Prevent future auto-grants to the browser roles.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM authenticated;

-- 3. Guarantee the server (service_role) keeps full access ---------------------
-- service_role bypasses RLS; these grants make table-level privileges explicit.
GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- Note: A prior dev migration (20250630000003) granted broad anon access and
-- disabled RLS for local development. This migration supersedes it. All access
-- now flows through the server; the browser never touches these tables directly.
