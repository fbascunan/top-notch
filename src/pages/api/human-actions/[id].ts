import type { APIRoute } from "astro";
import { createSSRClient } from "../../../lib/supabase-server";

export const prerender = false;

// PATCH — update human action status (pending ↔ done)
export const PATCH: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await request.json();
  const allowed = ["status"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (updates.status && updates.status !== "pending" && updates.status !== "done") {
    return new Response(JSON.stringify({ error: "Invalid status" }), { status: 400 });
  }

  const supabase = createSSRClient(request, cookies);
  const { data, error } = await supabase
    .from("human_actions")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};
