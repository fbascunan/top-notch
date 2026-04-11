import type { APIRoute } from "astro";
import { createUserClient } from "../../../lib/supabase-server";
import { COOKIE_ACCESS } from "../../../lib/auth";

export const prerender = false;

// PATCH — update project
export const PATCH: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const accessToken = cookies.get(COOKIE_ACCESS)?.value;
  if (!accessToken) return new Response(JSON.stringify({ error: "No session" }), { status: 401 });

  const body = await request.json();
  const allowed = ["name", "domain", "status", "priority", "notes"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) { if (key in body) updates[key] = body[key]; }
  // If name changed, update folder too
  if (updates.name && typeof updates.name === "string") {
    updates.folder = updates.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  const supabase = createUserClient(accessToken);
  const { data, error } = await supabase.from("projects").update(updates).eq("id", params.id).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};

// DELETE — delete project
export const DELETE: APIRoute = async ({ params, locals, cookies }) => {
  if (!locals.isMember) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const accessToken = cookies.get(COOKIE_ACCESS)?.value;
  if (!accessToken) return new Response(JSON.stringify({ error: "No session" }), { status: 401 });

  const supabase = createUserClient(accessToken);
  const { error } = await supabase.from("projects").delete().eq("id", params.id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(null, { status: 204 });
};
