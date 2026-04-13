import type { APIRoute } from "astro";
import { createSSRClient } from "../../lib/supabase-server";

export const prerender = false;

/**
 * POST /api/run-milestone
 * Triggers a GitHub Actions workflow dispatch for a milestone run.
 * Creates a run_history row with status "queued".
 */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  if (!locals.isMember || !locals.org) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await request.json();
  const { project_id, milestone_id, project_folder, milestone_number } = body;

  if (!project_id || !milestone_id || !project_folder || !milestone_number) {
    return new Response(
      JSON.stringify({ error: "project_id, milestone_id, project_folder, and milestone_number are required" }),
      { status: 400 },
    );
  }

  const supabase = createSSRClient(request, cookies);

  // Check for an active run on this project (prevent concurrent runs)
  const { data: activeRuns } = await supabase
    .from("run_history")
    .select("id")
    .eq("project_id", project_id)
    .in("status", ["queued", "running"])
    .limit(1);

  if (activeRuns && activeRuns.length > 0) {
    return new Response(
      JSON.stringify({ error: "A run is already in progress for this project" }),
      { status: 409 },
    );
  }

  // Trigger GitHub Actions workflow dispatch
  const githubToken = import.meta.env.GITHUB_TOKEN;
  if (!githubToken) {
    return new Response(
      JSON.stringify({ error: "GitHub token not configured" }),
      { status: 500 },
    );
  }

  const repo = "fbascunan/top-notch";
  const workflowId = "run-milestone.yml";

  const ghResponse = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/${workflowId}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          project_folder: String(project_folder),
          milestone_number: String(milestone_number),
        },
      }),
    },
  );

  if (!ghResponse.ok) {
    const errorText = await ghResponse.text();
    return new Response(
      JSON.stringify({ error: `GitHub API error: ${ghResponse.status} ${errorText}` }),
      { status: 502 },
    );
  }

  // Create run_history row
  const { data: run, error: insertError } = await supabase
    .from("run_history")
    .insert({
      project_id,
      milestone_id,
      status: "queued",
      triggered_by: locals.user?.id ?? null,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    return new Response(
      JSON.stringify({ error: insertError.message }),
      { status: 500 },
    );
  }

  return new Response(JSON.stringify(run), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
