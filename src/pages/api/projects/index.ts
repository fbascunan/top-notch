import type { APIRoute } from "astro";
import { createSSRClient } from "../../../lib/supabase-server";

export const prerender = false;

// GET — list org projects
export const GET: APIRoute = async ({ request, locals, cookies }) => {
  if (!locals.isMember || !locals.org) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createSSRClient(request, cookies);
  const { data, error } = await supabase
    .from("projects").select("*").eq("org_id", locals.org.orgId)
    .order("priority", { ascending: true });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};

// POST — create project
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  if (!locals.isMember || !locals.org) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await request.json();
  const { name, domain, status, priority, notes } = body;
  if (!name || typeof name !== "string") {
    return new Response(JSON.stringify({ error: "Name is required" }), { status: 400 });
  }
  // Derive folder from name
  const folder = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const supabase = createSSRClient(request, cookies);
  const { data, error } = await supabase.from("projects")
    .insert({ name, folder, domain: domain || null, status: status || "Planned", priority: priority ?? 99, notes: notes || null, org_id: locals.org.orgId })
    .select().single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 201, headers: { "Content-Type": "application/json" } });
};
