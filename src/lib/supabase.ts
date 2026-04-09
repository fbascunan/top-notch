import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/**
 * Whether Supabase is configured with valid credentials.
 * When false, consumers should fall back to local seed data.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let _client: SupabaseClient | null = null;

/**
 * Returns the Supabase client singleton.
 * Returns null when credentials are missing — callers must handle the fallback.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;

  if (!_client) {
    _client = createClient(supabaseUrl, supabaseKey);
  }

  return _client;
}
