#!/usr/bin/env node

/**
 * Shared Supabase helpers — used by both supabase-runner.mjs (GitHub Actions)
 * and routine-webhook.mjs (push event webhook).
 *
 * Uses the Supabase REST API (PostgREST) directly via fetch().
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export function headers(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

export function restUrl(table, query = "") {
  return `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ""}`;
}

export async function supaFetch(table, { query = "", method = "GET", body = null } = {}) {
  const url = restUrl(table, query);
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Supabase ${method} ${table}: ${res.status} — ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

// ────────────────────────────────────────────────────────────────
// Reusable commands
// ────────────────────────────────────────────────────────────────

/**
 * Update a run_history row with final status.
 */
export async function finishRun(runId, status, opts = {}) {
  const { commitSha, error, logsFile, logs } = opts;
  const update = {
    status,
    finished_at: new Date().toISOString(),
  };

  if (commitSha) update.commit_sha = commitSha;
  if (error) update.error = error.substring(0, 10000);

  if (logs) {
    let logText = logs;
    if (logText.length > 100_000) {
      logText = logText.substring(0, 50_000) + "\n\n... [truncated] ...\n\n" + logText.substring(logText.length - 50_000);
    }
    update.logs = logText;
  } else if (logsFile) {
    const { readFile } = await import("node:fs/promises");
    try {
      let logText = await readFile(logsFile, "utf-8");
      if (logText.length > 100_000) {
        logText = logText.substring(0, 50_000) + "\n\n... [truncated] ...\n\n" + logText.substring(logText.length - 50_000);
      }
      update.logs = logText;
    } catch {
      // Log file not found — not critical
    }
  }

  await supaFetch("run_history", {
    method: "PATCH",
    query: `id=eq.${runId}`,
    body: update,
  });
}

/**
 * Mark a milestone as Done in Supabase.
 */
export async function completeMilestone(milestoneId) {
  await supaFetch("milestones", {
    method: "PATCH",
    query: `id=eq.${milestoneId}`,
    body: {
      status: "Done",
      completed_at: new Date().toISOString(),
    },
  });
}

/**
 * Update tasks for a milestone based on Claude output file (output parsing).
 * Used by the old GitHub Actions runner (supabase-runner.mjs).
 */
export async function updateTasksFromOutput(milestoneId, claudeOutputFile) {
  const { readFile } = await import("node:fs/promises");
  let output;
  try {
    output = await readFile(claudeOutputFile, "utf-8");
  } catch {
    console.error(`Could not read Claude output file: ${claudeOutputFile}`);
    return;
  }

  const tasks = await supaFetch("milestone_tasks", {
    query: `milestone_id=eq.${milestoneId}&select=*&order=id.asc`,
  });

  if (!tasks || tasks.length === 0) return;

  const isComplete = output.includes("MILESTONE_COMPLETE");

  for (const task of tasks) {
    let shouldMarkDone = false;

    if (isComplete) {
      shouldMarkDone = true;
    } else {
      const escapedDesc = task.description.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`\\[x\\]\\s*${escapedDesc.substring(0, 60)}`, "i");
      if (pattern.test(output)) {
        shouldMarkDone = true;
      }
    }

    if (shouldMarkDone && !task.done) {
      await supaFetch("milestone_tasks", {
        method: "PATCH",
        query: `id=eq.${task.id}`,
        body: { done: true },
      });
    }
  }
}

/**
 * Update tasks for a milestone based on diff content (diff-based detection).
 * Used by the webhook to detect task completion from committed changes.
 *
 * Looks for lines like `- [x] Task description` that were added in the diff
 * (lines starting with `+`).
 */
export async function updateTasksFromDiff(milestoneId, diffContent) {
  if (!diffContent) return;

  const tasks = await supaFetch("milestone_tasks", {
    query: `milestone_id=eq.${milestoneId}&select=*&order=id.asc`,
  });

  if (!tasks || tasks.length === 0) return;

  // Extract added lines from the diff that contain checked task markers
  const addedCheckedTasks = diffContent
    .split("\n")
    .filter((line) => line.startsWith("+") && /\[x\]/i.test(line))
    .map((line) => line.substring(1).trim()); // Remove the leading `+`

  for (const task of tasks) {
    if (task.done) continue;

    // Check if any added line matches this task description
    const matched = addedCheckedTasks.some((addedLine) => {
      const escapedDesc = task.description
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .substring(0, 60);
      const pattern = new RegExp(escapedDesc, "i");
      return pattern.test(addedLine);
    });

    if (matched) {
      await supaFetch("milestone_tasks", {
        method: "PATCH",
        query: `id=eq.${task.id}`,
        body: { done: true },
      });
    }
  }
}

/**
 * Auto-fail any queued/running rows older than 2 hours.
 * Prevents stuck runs from blocking new ones.
 */
export async function cleanupStaleRuns() {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const staleRuns = await supaFetch("run_history", {
    query: `status=in.(queued,running)&started_at=lt.${twoHoursAgo}&select=id,status,started_at`,
  });

  if (!staleRuns || staleRuns.length === 0) {
    console.log("No stale runs found.");
    return 0;
  }

  console.log(`Found ${staleRuns.length} stale run(s) to clean up.`);

  for (const run of staleRuns) {
    await supaFetch("run_history", {
      method: "PATCH",
      query: `id=eq.${run.id}`,
      body: {
        status: "failed",
        error: "Auto-failed: stuck in queued/running for over 2 hours",
        finished_at: new Date().toISOString(),
      },
    });
    console.log(`  Stale run ${run.id} (${run.status} since ${run.started_at}) marked as failed.`);
  }

  return staleRuns.length;
}

/**
 * Look up a run_history row by correlation_id.
 * Returns the row or null if not found.
 */
export async function findRunByCorrelationId(correlationId) {
  const rows = await supaFetch("run_history", {
    query: `correlation_id=eq.${encodeURIComponent(correlationId)}&select=*`,
  });

  if (!rows || rows.length === 0) return null;
  return rows[0];
}

/**
 * Find a milestone by project_id and number.
 */
export async function findMilestone(projectId, milestoneNumber) {
  const rows = await supaFetch("milestones", {
    query: `project_id=eq.${projectId}&number=eq.${milestoneNumber}&select=*`,
  });

  if (!rows || rows.length === 0) return null;
  return rows[0];
}
