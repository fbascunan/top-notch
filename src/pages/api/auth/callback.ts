import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "../../../lib/auth";

export const prerender = false;

const cookieOptions = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get("code");
  if (!code) {
    return redirect("/?error=no_code", 302);
  }

  const codeVerifier = cookies.get("sb-code-verifier")?.value;
  if (!codeVerifier) {
    return redirect("/?error=no_verifier", 302);
  }

  // Clean up the verifier cookie
  cookies.delete("sb-code-verifier", { path: "/" });

  const supabaseUrl = import.meta.env.SUPABASE_URL ?? "";
  const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY ?? "";

  // Exchange the code + verifier for a session via Supabase's token endpoint
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({
      auth_code: code,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Token exchange failed:", err);
    return redirect("/?error=auth_failed", 302);
  }

  const session = await response.json();

  cookies.set(COOKIE_ACCESS, session.access_token, cookieOptions);
  cookies.set(COOKIE_REFRESH, session.refresh_token, cookieOptions);

  const rawNext = url.searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  return redirect(next, 302);
};
