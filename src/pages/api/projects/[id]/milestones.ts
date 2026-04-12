import type { APIRoute } from "astro";
import { createSSRClient } from "../../../../lib/supabase-server";


// GET — list milestones for a project
export const GET: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const supabase = createSSRClient(request, cookies);
  const { data, error } = await supabase
    .from("milestones").select("*").eq("project_id", params.id)
    .order("number", { ascending: true });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};

// POST — create milestone
export const POST: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await request.json();
  const { title, description, status, blocking, number } = body;
  if (!title || typeof title !== "string") {
    return new Response(JSON.stringify({ error: "Title is required" }), { status: 400 });
  }

  const supabase = createSSRClient(request, cookies);

  // Auto-assign number if not provided
  let milestoneNumber = number;
  if (milestoneNumber == null) {
    const { data: existing } = await supabase
      .from("milestones").select("number").eq("project_id", params.id)
      .order("number", { ascending: false }).limit(1);
    milestoneNumber = existing && existing.length > 0 ? existing[0].number + 1 : 1;
  }

  const { data, error } = await supabase.from("milestones")
    .insert({
      project_id: Number(params.id),
      title,
      description: description || null,
      status: status || "Planned",
      blocking: blocking ?? false,
      number: milestoneNumber,
    })
    .select().single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 201, headers: { "Content-Type": "application/json" } });
};
