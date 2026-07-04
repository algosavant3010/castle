import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client (for use in API routes only).
 * Uses the service role key to bypass RLS.
 */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
