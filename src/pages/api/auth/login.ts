import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

/**
 * Generate PKCE code verifier and challenge manually so we can persist
 * the verifier in a cookie between the login and callback requests.
 */
async function generatePKCE() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = base64UrlEncode(array);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  const challenge = base64UrlEncode(new Uint8Array(digest));
  return { verifier, challenge };
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export const GET: APIRoute = async ({ url, redirect, cookies }) => {
  const supabaseUrl = import.meta.env.SUPABASE_URL ?? "";
  const origin = url.origin;

  const { verifier, challenge } = await generatePKCE();

  // Store verifier in a cookie so the callback can read it
  cookies.set("sb-code-verifier", verifier, {
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 300, // 5 minutes, enough for OAuth round-trip
  });

  // Build the authorization URL with PKCE parameters
  const params = new URLSearchParams({
    provider: "google",
    redirect_to: `${origin}/api/auth/callback`,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  return redirect(`${supabaseUrl}/auth/v1/authorize?${params.toString()}`, 302);
};
