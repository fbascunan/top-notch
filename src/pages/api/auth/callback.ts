import type { APIRoute } from "astro";
import { createSSRClient } from "../../../lib/supabase-server";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabase = createSSRClient(request, cookies);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const safePath = next.startsWith("/") && !next.startsWith("//") ? next : "/";
      return redirect(safePath, 302);
    }
  }

  return redirect("/?error=auth_failed", 302);
};
