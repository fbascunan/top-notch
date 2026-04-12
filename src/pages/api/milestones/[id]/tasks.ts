import type { APIRoute } from "astro";
import { createSSRClient } from "../../../../lib/supabase-server";


// POST — create task for a milestone
export const POST: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await request.json();
  const { description } = body;
  if (!description || typeof description !== "string") {
    return new Response(JSON.stringify({ error: "Description is required" }), { status: 400 });
  }

  const supabase = createSSRClient(request, cookies);
  const { data, error } = await supabase.from("milestone_tasks")
    .insert({
      milestone_id: Number(params.id),
      description,
      done: false,
    })
    .select().single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 201, headers: { "Content-Type": "application/json" } });
};
