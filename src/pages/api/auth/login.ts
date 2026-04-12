import type { APIRoute } from "astro";
import { createSSRClient } from "../../../lib/supabase-server";


export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSSRClient(request, cookies);
  const origin = new URL(request.url).origin;

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
