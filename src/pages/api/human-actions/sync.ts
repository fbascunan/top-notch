import type { APIRoute } from "astro";
import { createSSRClient } from "../../../lib/supabase-server";
import { parseHumanActions } from "../../../lib/human-actions-parser";

export const prerender = false;

/**
 * POST /api/human-actions/sync
 * Body: { project_id: number, markdown: string }
 *
 * Parses HUMAN-ACTIONS.md content and upserts into Supabase.
 * Matching is done by project_id + milestone + description.
 * New actions are inserted; existing actions keep their status.
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  if (!locals.isMember) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await request.json();
  const { project_id, markdown } = body;

  if (!project_id || !markdown) {
    return new Response(JSON.stringify({ error: "project_id and markdown are required" }), { status: 400 });
  }

  const parsed = parseHumanActions(markdown);
  if (parsed.length === 0) {
    return new Response(JSON.stringify({ message: "No actions found in markdown", count: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createSSRClient(request, cookies);

  // Fetch existing actions for this project
  const { data: existing } = await supabase
    .from("human_actions")
    .select("id, milestone, description")
    .eq("project_id", project_id);

  const existingSet = new Set(
    (existing ?? []).map((e: any) => `${e.milestone}::${e.description}`),
  );

  // Filter to only new actions
  const newActions = parsed
    .filter((a) => !existingSet.has(`${a.milestone}::${a.description}`))
    .map((a) => ({
      project_id: Number(project_id),
      milestone: a.milestone,
      description: a.description,
      is_blocker: a.is_blocker,
      status: a.status,
    }));

  if (newActions.length === 0) {
    return new Response(JSON.stringify({ message: "All actions already synced", count: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabase.from("human_actions").insert(newActions).select();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ message: `Synced ${data.length} new actions`, count: data.length }),
    { headers: { "Content-Type": "application/json" } },
  );
};
