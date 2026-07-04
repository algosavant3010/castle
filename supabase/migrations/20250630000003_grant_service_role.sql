-- Grant full access to service_role (used by the Express server)
-- The service_role key bypasses RLS by default, but needs table grants

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- Also grant to anon for frontend reads (with RLS protection)
GRANT SELECT, INSERT, UPDATE ON public.vaults TO anon;
GRANT SELECT, INSERT, UPDATE ON public.agents TO anon;
GRANT SELECT ON public.transactions TO anon;
GRANT SELECT ON public.request_logs TO anon;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO anon;
GRANT SELECT, INSERT, UPDATE ON public.policy_templates TO anon;
GRANT SELECT ON public.pending_approvals TO anon;

-- Disable RLS for now (local dev) — enable in production with proper policies
ALTER TABLE vaults DISABLE ROW LEVEL SECURITY;
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;
ALTER TABLE request_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE policy_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE signing_patterns DISABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_otps DISABLE ROW LEVEL SECURITY;
ALTER TABLE known_ips DISABLE ROW LEVEL SECURITY;
ALTER TABLE pending_approvals DISABLE ROW LEVEL SECURITY;
