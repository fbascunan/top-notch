import type { APIRoute } from "astro";
import { createUserClient } from "../../../lib/supabase-server";
import { COOKIE_ACCESS } from "../../../lib/auth";

export const prerender = false;

// PATCH — update task
export const PATCH: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const accessToken = cookies.get(COOKIE_ACCESS)?.value;
  if (!accessToken) return new Response(JSON.stringify({ error: "No session" }), { status: 401 });

  const body = await request.json();
  const allowed = ["description", "done"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) { if (key in body) updates[key] = body[key]; }

  const supabase = createUserClient(accessToken);
  const { data, error } = await supabase.from("milestone_tasks").update(updates).eq("id", params.id).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};

// DELETE — delete task
export const DELETE: APIRoute = async ({ params, locals, cookies }) => {
  if (!locals.isMember) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const accessToken = cookies.get(COOKIE_ACCESS)?.value;
  if (!accessToken) return new Response(JSON.stringify({ error: "No session" }), { status: 401 });

  const supabase = createUserClient(accessToken);
  const { error } = await supabase.from("milestone_tasks").delete().eq("id", params.id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(null, { status: 204 });
};
