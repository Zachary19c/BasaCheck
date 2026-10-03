import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// No login. The browser never talks to Supabase; every read and write goes
// through server code using this client. The service-role key bypasses RLS,
// so it must stay server-side and routes must validate all input.
export function createClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
