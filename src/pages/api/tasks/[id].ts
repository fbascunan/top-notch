import type { APIRoute } from "astro";
import { createSSRClient } from "../../../lib/supabase-server";


// PATCH — update task
export const PATCH: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await request.json();
  const allowed = ["description", "done"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) { if (key in body) updates[key] = body[key]; }

  const supabase = createSSRClient(request, cookies);
  const { data, error } = await supabase.from("milestone_tasks").update(updates).eq("id", params.id).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};

// DELETE — delete task
export const DELETE: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const supabase = createSSRClient(request, cookies);
  const { error } = await supabase.from("milestone_tasks").delete().eq("id", params.id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(null, { status: 204 });
};
