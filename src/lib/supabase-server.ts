import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { AstroCookies } from "astro";

const supabaseUrl = import.meta.env.SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY ?? "";
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * Creates a Supabase client authenticated with the user's JWT.
 * Used by API routes to perform queries that respect Row Level Security.
 */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

/**
 * Creates a Supabase client with the service role key.
 * Bypasses RLS — use only for server-side automation tasks.
 * Returns null if the service role key is not configured.
 */
export function createServiceClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates a Supabase SSR client from an Astro request context.
 * Handles cookie-based auth automatically via @supabase/ssr.
 * Use in API routes and middleware instead of createUserClient.
 */
export function createSSRClient(request: Request, cookies: AstroCookies) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("Cookie") ?? "").map(
          (c) => ({ name: c.name, value: c.value ?? "" }),
        );
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookies.set(name, value, options),
        );
      },
    },
  });
}

/**
 * Creates an anonymous Supabase client (same privileges as the build-time client).
 * Returns null if env vars are missing.
 */
export function createAnonClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey);
}
