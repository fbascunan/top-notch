import type { APIRoute } from "astro";
import { createSSRClient } from "../../lib/supabase-server";

export const prerender = false;

/**
 * POST /api/run-milestone
 * Triggers a Claude Code Routine via the /fire API endpoint.
 * Creates a run_history row with status "queued" and a correlation_id.
 *
 * Replaces the old GitHub Actions workflow_dispatch approach (M20–M22).
 * Runs under the user's Claude Max subscription — no ANTHROPIC_API_KEY needed.
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

  // ── Stale-run cleanup ────────────────────────────────────────────
  // Auto-fail any queued/running rows older than 2 hours before checking
  // for active runs. Prevents stuck runs from blocking new ones forever.
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("run_history")
    .update({
      status: "failed",
      error: "Auto-failed: stuck in queued/running for over 2 hours",
      finished_at: new Date().toISOString(),
    })
    .in("status", ["queued", "running"])
    .lt("started_at", twoHoursAgo);

  // ── Active run check ─────────────────────────────────────────────
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

  // ── Routine trigger config ───────────────────────────────────────
  const routineTriggerId = import.meta.env.ROUTINE_TRIGGER_ID;
  const routineBearerToken = import.meta.env.ROUTINE_BEARER_TOKEN;

  if (!routineTriggerId || !routineBearerToken) {
    return new Response(
      JSON.stringify({ error: "Routine trigger not configured. Set ROUTINE_TRIGGER_ID and ROUTINE_BEARER_TOKEN in Netlify env vars." }),
      { status: 500 },
    );
  }

  // ── Generate correlation ID ──────────────────────────────────────
  const correlationId = crypto.randomUUID();

  // ── Fire the routine ─────────────────────────────────────────────
  const fireUrl = `https://api.anthropic.com/v1/claude_code/routines/${routineTriggerId}/fire`;
  const triggerText = [
    `Milestone: M${milestone_number}`,
    `Project folder: ${project_folder}`,
    `Correlation ID: ${correlationId}`,
    ``,
    `Include [run:${correlationId}] in all commit messages for this run.`,
    `Read docs/MILESTONES.md, find M${milestone_number}, and complete it.`,
  ].join("\n");

  let fireResponse: Response;
  try {
    fireResponse = await fetch(fireUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${routineBearerToken}`,
        "anthropic-beta": "experimental-cc-routine-2026-04-01",
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: triggerText }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err: unknown) {
    const message = err instanceof Error && err.name === "TimeoutError"
      ? "Routine API request timed out (30s). The service may be temporarily unavailable."
      : `Failed to reach routine API: ${err instanceof Error ? err.message : String(err)}`;
    return new Response(
      JSON.stringify({ error: message }),
      { status: 502 },
    );
  }

  if (!fireResponse.ok) {
    const errorText = await fireResponse.text();

    // Map known error statuses to user-facing messages
    if (fireResponse.status === 429) {
      return new Response(
        JSON.stringify({
          error: "Daily routine run limit reached (15/day for Max plan). Try again tomorrow.",
          detail: errorText,
        }),
        { status: 429 },
      );
    }

    if (fireResponse.status === 401 || fireResponse.status === 403) {
      return new Response(
        JSON.stringify({
          error: "Routine authentication failed. The bearer token may be expired or revoked.",
          detail: errorText,
        }),
        { status: 502 },
      );
    }

    return new Response(
      JSON.stringify({
        error: `Routine API error: ${fireResponse.status}`,
        detail: errorText,
      }),
      { status: 502 },
    );
  }

  // Parse the routine response to get session info
  let routineResult: { claude_code_session_id?: string; claude_code_session_url?: string } = {};
  try {
    routineResult = await fireResponse.json();
  } catch {
    // Non-critical — we still have the correlation_id for tracking
  }

  // ── Create run_history row ───────────────────────────────────────
  const { data: run, error: insertError } = await supabase
    .from("run_history")
    .insert({
      project_id,
      milestone_id,
      status: "queued",
      triggered_by: locals.user?.id ?? null,
      started_at: new Date().toISOString(),
      correlation_id: correlationId,
      trigger_source: "manual",
    })
    .select()
    .single();

  if (insertError) {
    return new Response(
      JSON.stringify({ error: insertError.message }),
      { status: 500 },
    );
  }

  return new Response(
    JSON.stringify({
      ...run,
      session_url: routineResult.claude_code_session_url ?? null,
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    },
  );
};
