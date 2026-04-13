import type { APIRoute } from "astro";
import { createSSRClient } from "../../../lib/supabase-server";

export const prerender = false;

/**
 * GET /api/run-history/[id]
 * Returns a single run_history row with project and milestone info.
 */
export const GET: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember || !locals.org) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: "Run ID is required" }), { status: 400 });
  }

  const supabase = createSSRClient(request, cookies);

  const { data: run, error } = await supabase
    .from("run_history")
    .select("*, projects(name, folder), milestones(number, title)")
    .eq("id", id)
    .single();

  if (error || !run) {
    return new Response(
      JSON.stringify({ error: error?.message ?? "Run not found" }),
      { status: 404 },
    );
  }

  return new Response(JSON.stringify(run), {
    headers: { "Content-Type": "application/json" },
  });
};
