import type { APIRoute } from "astro";
import { createSSRClient } from "../../../lib/supabase-server";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSSRClient(request, cookies);
  await supabase.auth.signOut();
  return redirect("/", 302);
};
