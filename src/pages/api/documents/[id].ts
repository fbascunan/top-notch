import type { APIRoute } from "astro";
import { createSSRClient } from "../../../lib/supabase-server";


const MAX_CONTENT_SIZE = 1_000_000; // 1 MB

// GET — get single document by id (full content)
export const GET: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const supabase = createSSRClient(request, cookies);
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};

// PATCH — update document
export const PATCH: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await request.json();
  const allowed = ["title", "slug", "content", "doc_type"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  // Enforce content size limit
  if (typeof updates.content === "string" && (updates.content as string).length > MAX_CONTENT_SIZE) {
    return new Response(JSON.stringify({ error: "Content exceeds 1 MB limit" }), { status: 413 });
  }

  const supabase = createSSRClient(request, cookies);
  const { data, error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};

// DELETE — delete document by id
export const DELETE: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const supabase = createSSRClient(request, cookies);
  const { error } = await supabase.from("documents").delete().eq("id", params.id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(null, { status: 204 });
};
