#!/usr/bin/env node

/**
 * Routine Webhook Handler — processes push events from GitHub Actions.
 *
 * Detects routine-originated commits by parsing [run:<correlation_id>] tags
 * from commit messages. For each matched correlation_id:
 *   1. Looks up the run_history row in Supabase
 *   2. Determines completion status from MILESTONES.md changes
 *   3. Updates run_history with status, commit_sha, finished_at
 *   4. If a milestone was marked Done, updates milestones table
 *   5. Parses task completion from diffs
 *
 * Also cleans up stale runs (queued/running > 2 hours) on every invocation.
 *
 * Usage:
 *   GITHUB_EVENT_PATH=/path/to/event.json \
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node routine-webhook.mjs
 *
 * Environment:
 *   GITHUB_EVENT_PATH  — path to the push event JSON (set by GitHub Actions)
 *   SUPABASE_URL       — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS)
 */

import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";

import {
  isConfigured,
  supaFetch,
  finishRun,
  completeMilestone,
  updateTasksFromDiff,
  cleanupStaleRuns,
  findRunByCorrelationId,
  findMilestone,
} from "./supabase-helpers.mjs";

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

/**
 * Extract all [run:<id>] correlation IDs from an array of commit messages.
 * Returns a deduplicated array of { correlationId, commitSha, message }.
 */
function extractCorrelationIds(commits) {
  const pattern = /\[run:([^\]]+)\]/g;
  const results = [];
  const seen = new Set();

  for (const commit of commits) {
    let match;
    while ((match = pattern.exec(commit.message)) !== null) {
      const correlationId = match[1];
      if (!seen.has(correlationId)) {
        seen.add(correlationId);
        results.push({
          correlationId,
          commitSha: commit.id,
          message: commit.message,
        });
      }
    }
  }

  return results;
}

/**
 * Check if MILESTONES.md was changed in the push and detect milestone
 * status changes to "Done".
 *
 * Uses git diff between before/after SHAs to find added lines
 * containing "| Done |" in the tracker table.
 *
 * Returns an array of milestone numbers that were marked Done.
 */
function detectMilestoneCompletions(beforeSha, afterSha) {
  try {
    // Get diff for MILESTONES.md only
    const diff = execSync(
      `git diff ${beforeSha}..${afterSha} -- docs/MILESTONES.md`,
      { encoding: "utf-8", timeout: 10_000 },
    );

    if (!diff) return [];

    // Look for added lines (starting with +) that show a milestone marked Done
    // Tracker format: | M25 — GitHub Webhook Listener | Done | M24 |
    const donePattern = /^\+\|.*?(M(\d+)).*?\|\s*Done\s*\|/gm;
    const completions = [];
    let match;
    while ((match = donePattern.exec(diff)) !== null) {
      completions.push(parseInt(match[2], 10));
    }

    return completions;
  } catch (err) {
    console.warn(`Could not diff MILESTONES.md: ${err.message}`);
    return [];
  }
}

/**
 * Get the full diff for a push (for task completion detection).
 * Focuses on MILESTONES.md changes where task checkboxes live.
 */
function getPushDiff(beforeSha, afterSha) {
  try {
    return execSync(
      `git diff ${beforeSha}..${afterSha} -- docs/MILESTONES.md`,
      { encoding: "utf-8", timeout: 10_000 },
    );
  } catch (err) {
    console.warn(`Could not get push diff: ${err.message}`);
    return "";
  }
}

/**
 * Determine run status based on the push content.
 * - If MILESTONES.md shows milestone marked Done → completed
 * - If commit message contains MILESTONE_COMPLETE → completed
 * - Otherwise → failed (routine ran but didn't finish the milestone)
 */
function determineRunStatus(commitMessage, milestoneCompletions) {
  if (milestoneCompletions.length > 0) return "completed";
  if (commitMessage.includes("MILESTONE_COMPLETE")) return "completed";
  return "failed";
}

// ────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────

async function main() {
  // ── Validate configuration ────────────────────────────────────
  if (!isConfigured()) {
    console.error("SUPABASE_NOT_CONFIGURED: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    process.exit(2);
  }

  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    console.error("GITHUB_EVENT_PATH not set — must be run inside a GitHub Actions workflow");
    process.exit(1);
  }

  // ── Parse push event ──────────────────────────────────────────
  let event;
  try {
    const raw = await readFile(eventPath, "utf-8");
    event = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read push event: ${err.message}`);
    process.exit(1);
  }

  const commits = event.commits || [];
  const beforeSha = event.before;
  const afterSha = event.after;
  const ref = event.ref || "";

  console.log(`Push event: ${commits.length} commit(s) on ${ref}`);
  console.log(`  Before: ${beforeSha}`);
  console.log(`  After:  ${afterSha}`);

  // ── Always clean up stale runs ────────────────────────────────
  try {
    await cleanupStaleRuns();
  } catch (err) {
    console.warn(`Stale run cleanup failed (non-critical): ${err.message}`);
  }

  // ── Extract correlation IDs from commit messages ──────────────
  const correlations = extractCorrelationIds(commits);

  if (correlations.length === 0) {
    console.log("No [run:<correlation_id>] tags found — this is a human push. Nothing to do.");
    process.exit(0);
  }

  console.log(`Found ${correlations.length} correlation ID(s):`);
  for (const c of correlations) {
    console.log(`  [run:${c.correlationId}] in commit ${c.commitSha.substring(0, 8)}`);
  }

  // ── Detect milestone completions from MILESTONES.md diff ──────
  const milestoneCompletions = detectMilestoneCompletions(beforeSha, afterSha);
  if (milestoneCompletions.length > 0) {
    console.log(`Milestone completions detected: ${milestoneCompletions.map((n) => `M${n}`).join(", ")}`);
  }

  // ── Get push diff for task completion detection ───────────────
  const pushDiff = getPushDiff(beforeSha, afterSha);

  // ── Process each correlation ID ───────────────────────────────
  for (const { correlationId, commitSha, message } of correlations) {
    console.log(`\nProcessing [run:${correlationId}]...`);

    // 1. Look up run_history row
    let run;
    try {
      run = await findRunByCorrelationId(correlationId);
    } catch (err) {
      console.warn(`  Failed to look up correlation_id: ${err.message}`);
      continue;
    }

    if (!run) {
      console.warn(`  WARNING: No run_history row found for correlation_id="${correlationId}". Skipping.`);
      continue;
    }

    console.log(`  Matched run_history row: id=${run.id}, milestone_id=${run.milestone_id}, status=${run.status}`);

    // Skip if already in a terminal state
    if (run.status === "completed" || run.status === "failed") {
      console.log(`  Run is already in terminal state (${run.status}). Skipping.`);
      continue;
    }

    // 2. Determine run status
    const status = determineRunStatus(message, milestoneCompletions);
    console.log(`  Determined status: ${status}`);

    // 3. Update run_history
    try {
      await finishRun(run.id, status, {
        commitSha,
        error: status === "failed" ? "Routine completed but milestone was not marked as Done" : undefined,
      });
      console.log(`  Updated run_history: status=${status}, commit_sha=${commitSha.substring(0, 8)}`);
    } catch (err) {
      console.error(`  Failed to update run_history: ${err.message}`);
    }

    // 4. If milestone was marked Done, update milestones table
    if (milestoneCompletions.length > 0 && run.milestone_id) {
      // Find the milestone to get its number
      try {
        const milestones = await supaFetch("milestones", {
          query: `id=eq.${run.milestone_id}&select=id,number,project_id,status`,
        });

        if (milestones && milestones.length > 0) {
          const milestone = milestones[0];
          if (milestoneCompletions.includes(milestone.number) && milestone.status !== "Done") {
            await completeMilestone(milestone.id);
            console.log(`  Marked milestone M${milestone.number} (id=${milestone.id}) as Done in Supabase.`);
          }
        }
      } catch (err) {
        console.warn(`  Failed to update milestone status: ${err.message}`);
      }
    }

    // 5. Parse task completion from diff
    if (pushDiff && run.milestone_id) {
      try {
        await updateTasksFromDiff(run.milestone_id, pushDiff);
        console.log(`  Updated tasks from diff for milestone_id=${run.milestone_id}.`);
      } catch (err) {
        console.warn(`  Failed to update tasks from diff: ${err.message}`);
      }
    }
  }

  console.log("\nWebhook processing complete.");
}

main().catch((err) => {
  console.error(`Unhandled error: ${err.message}`);
  process.exit(1);
});
