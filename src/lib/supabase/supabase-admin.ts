import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Creates a Supabase client with the service role key.
 * Bypasses RLS — ONLY use server-side for admin provisioning actions.
 * Never expose this client or the key to the browser.
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — " +
      "cannot create admin Supabase client"
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
