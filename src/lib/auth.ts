import type { AstroCookies } from "astro";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY ?? "";

export const COOKIE_ACCESS = "sb-access-token";
export const COOKIE_REFRESH = "sb-refresh-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const cookieOptions = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: COOKIE_MAX_AGE,
};

/**
 * Exchanges an OAuth authorization code for a session and stores tokens in cookies.
 */
export async function handleAuthCallback(
  code: string,
  cookies: AstroCookies,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return { success: false, error: error?.message ?? "No session returned" };
  }

  cookies.set(COOKIE_ACCESS, data.session.access_token, cookieOptions);
  cookies.set(COOKIE_REFRESH, data.session.refresh_token, cookieOptions);

  return { success: true };
}

/**
 * Reads the session from cookies and returns the authenticated user.
 * Attempts a token refresh if the access token is expired.
 * Clears cookies if no valid session can be recovered.
 */
export async function getSessionFromCookies(
  cookies: AstroCookies,
): Promise<{ user: App.Locals["user"]; accessToken: string | null }> {
  const accessToken = cookies.get(COOKIE_ACCESS)?.value ?? null;
  const refreshToken = cookies.get(COOKIE_REFRESH)?.value ?? null;

  if (!accessToken) {
    return { user: null, accessToken: null };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Try the current access token
  const { data: userData, error: userError } =
    await supabase.auth.getUser(accessToken);

  if (!userError && userData.user) {
    return {
      user: mapUser(userData.user),
      accessToken,
    };
  }

  // Access token expired — attempt refresh
  if (refreshToken) {
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

    if (!refreshError && refreshData.session) {
      cookies.set(
        COOKIE_ACCESS,
        refreshData.session.access_token,
        cookieOptions,
      );
      cookies.set(
        COOKIE_REFRESH,
        refreshData.session.refresh_token,
        cookieOptions,
      );

      return {
        user: mapUser(refreshData.session.user),
        accessToken: refreshData.session.access_token,
      };
    }
  }

  // All recovery attempts failed
  clearSession(cookies);
  return { user: null, accessToken: null };
}

/**
 * Deletes auth cookies, effectively logging the user out.
 */
export function clearSession(cookies: AstroCookies): void {
  cookies.delete(COOKIE_ACCESS, { path: "/" });
  cookies.delete(COOKIE_REFRESH, { path: "/" });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapUser(
  raw: Record<string, any>,
): NonNullable<App.Locals["user"]> {
  return {
    id: raw.id,
    email: raw.email ?? "",
    name: raw.user_metadata?.full_name ?? raw.user_metadata?.name ?? "",
    avatarUrl: raw.user_metadata?.avatar_url ?? "",
  };
}
