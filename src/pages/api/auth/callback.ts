import type { APIRoute } from "astro";
import { handleAuthCallback } from "../../../lib/auth";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get("code");
  if (!code) {
    return redirect("/?error=no_code", 302);
  }
  const { success, error } = await handleAuthCallback(code, cookies);
  if (!success) {
    console.error("Auth callback failed:", error);
    return redirect("/?error=auth_failed", 302);
  }
  const rawNext = url.searchParams.get("next") ?? "/";
  // Prevent open redirect: only allow relative paths
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  return redirect(next, 302);
};
