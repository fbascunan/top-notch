import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

export const GET: APIRoute = async ({ url, redirect }) => {
  const supabaseUrl = import.meta.env.SUPABASE_URL ?? "";
  const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY ?? "";
  const origin = url.origin;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { flowType: "pkce" },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error || !data.url) {
    return redirect("/?error=oauth_init_failed", 302);
  }

  return redirect(data.url, 302);
};
