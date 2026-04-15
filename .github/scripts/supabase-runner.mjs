#!/usr/bin/env node

/**
 * Supabase Runner Helper — handles all Supabase interactions for the
 * GitHub Actions milestone runner workflow.
 *
 * Delegates to shared helpers in supabase-helpers.mjs for reusable operations.
 *
 * Commands:
 *   fetch-context <project_folder> [milestone_number]
 *     → Fetches project, milestone, and tasks from DB. Outputs JSON to stdout.
 *       If milestone_number is omitted, picks the next Planned milestone.
 *
 *   start-run <project_id> <milestone_id>
 *     → Creates a run_history row with status "running". Outputs run ID.
 *
 *   finish-run <run_id> <status> [--commit-sha=X] [--error=X] [--logs-file=X]
 *     → Updates run_history with final status, finished_at, logs, commit_sha, error.
 *
 *   complete-milestone <milestone_id>
 *     → Sets milestone status to "Done" and completed_at to now.
 *
 *   update-tasks <milestone_id> <claude_output_file>
 *     → Parses Claude output for task completion markers and updates tasks in DB.
 *
 *   callback <netlify_url> <run_id> <status>
 *     → POSTs run status to a Netlify function (optional, best-effort).
 */

import {
  isConfigured,
  supaFetch,
  finishRun,
  completeMilestone,
  updateTasksFromOutput,
} from "./supabase-helpers.mjs";

// ────────────────────────────────────────────────────────────────
// Commands
// ────────────────────────────────────────────────────────────────

async function fetchContext(projectFolder, milestoneNumber) {
  // 1. Find project by folder name
  const projects = await supaFetch("projects", {
    query: `folder=eq.${encodeURIComponent(projectFolder)}&select=*`,
  });

  if (!projects || projects.length === 0) {
    throw new Error(`Project with folder "${projectFolder}" not found in Supabase`);
  }
  const project = projects[0];

  // 2. Find milestone
  let milestones;
  if (milestoneNumber) {
    milestones = await supaFetch("milestones", {
      query: `project_id=eq.${project.id}&number=eq.${milestoneNumber}&select=*`,
    });
  } else {
    // Get next Planned milestone (lowest number)
    milestones = await supaFetch("milestones", {
      query: `project_id=eq.${project.id}&status=eq.Planned&select=*&order=number.asc&limit=1`,
    });
  }

  if (!milestones || milestones.length === 0) {
    const what = milestoneNumber ? `M${milestoneNumber}` : "next Planned milestone";
    throw new Error(`${what} not found for project "${projectFolder}"`);
  }
  const milestone = milestones[0];

  // 3. Fetch tasks for this milestone
  const tasks = await supaFetch("milestone_tasks", {
    query: `milestone_id=eq.${milestone.id}&select=*&order=id.asc`,
  });

  // 4. Fetch all milestones for context (dependency awareness)
  const allMilestones = await supaFetch("milestones", {
    query: `project_id=eq.${project.id}&select=id,number,title,status&order=number.asc`,
  });

  return { project, milestone, tasks: tasks || [], allMilestones: allMilestones || [] };
}

function buildPrompt(context) {
  const { project, milestone, tasks, allMilestones } = context;

  // Build task list
  const taskList = tasks.length > 0
    ? tasks.map((t) => `- [${t.done ? "x" : " "}] ${t.description}`).join("\n")
    : "(no tasks defined)";

  // Build milestone context summary
  const milestoneContext = allMilestones
    .map((m) => `  M${m.number} — ${m.title} [${m.status}]`)
    .join("\n");

  const prompt = `You are working on the "${project.name}" project (folder: ${project.folder}). Your goal is to complete milestone M${milestone.number} autonomously.

## Before you start
1. Read docs/PROSPECT.md first — understand who we are building for and why
2. Read docs/BITACORA.md for context on previous sessions
3. Read docs/MILESTONES.md for the full milestone list and dependencies
4. Read CLAUDE.md if it exists for project-specific instructions

## Your milestone: M${milestone.number} — ${milestone.title}

${milestone.description || ""}

### Tasks

${taskList}

## Project milestones overview

${milestoneContext}

## Rules
- Complete every task checkbox in this milestone
- Follow the "Done when" acceptance criteria exactly
- Always install dependencies locally in the project, never globally
- If this is a setup/scaffolding milestone and it completes successfully, create a brief README.md at the project root with: project name, one-line description, tech stack, and how to run it (dev/build/test commands)
- When ALL tasks are done AND acceptance criteria are met:
  1. Update the tracker table in docs/MILESTONES.md — change this milestone's status from "Planned" to "Done"
  2. Write a session entry in docs/BITACORA.md (follow the format in that file)
  3. Commit your work with a clear message
  4. Output <promise>MILESTONE_COMPLETE</promise> to signal completion
- Do NOT output the promise tag until everything is truly complete
- If you get stuck on something, document what's blocking in BITACORA.md, commit, and output the promise tag with the blocker noted in the bitacora`;

  return prompt;
}

async function startRun(projectId, milestoneId) {
  const rows = await supaFetch("run_history", {
    method: "POST",
    body: {
      project_id: parseInt(projectId, 10),
      milestone_id: parseInt(milestoneId, 10),
      status: "running",
      started_at: new Date().toISOString(),
    },
  });

  if (!rows || rows.length === 0) {
    throw new Error("Failed to create run_history row");
  }
  return rows[0];
}

async function callback(netlifyUrl, runId, status) {
  try {
    const res = await fetch(netlifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ run_id: parseInt(runId, 10), status }),
    });
    if (!res.ok) {
      console.warn(`Callback to ${netlifyUrl} returned ${res.status}`);
    }
  } catch (err) {
    console.warn(`Callback to ${netlifyUrl} failed: ${err.message}`);
  }
}

// ────────────────────────────────────────────────────────────────
// CLI dispatch
// ────────────────────────────────────────────────────────────────

async function main() {
  const [, , command, ...args] = process.argv;

  if (!command) {
    console.error("Usage: supabase-runner.mjs <command> [args...]");
    process.exit(1);
  }

  if (!isConfigured()) {
    // Graceful fallback — output a clear message and exit with special code
    console.error("SUPABASE_NOT_CONFIGURED: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    process.exit(2);
  }

  try {
    switch (command) {
      case "fetch-context": {
        const [projectFolder, milestoneNumber] = args;
        if (!projectFolder) {
          console.error("Usage: fetch-context <project_folder> [milestone_number]");
          process.exit(1);
        }
        const context = await fetchContext(projectFolder, milestoneNumber || null);
        // Output both the context JSON and the built prompt
        const prompt = buildPrompt(context);
        const result = {
          project_id: context.project.id,
          milestone_id: context.milestone.id,
          milestone_number: context.milestone.number,
          milestone_title: context.milestone.title,
          prompt,
        };
        console.log(JSON.stringify(result));
        break;
      }

      case "start-run": {
        const [projectId, milestoneId] = args;
        if (!projectId || !milestoneId) {
          console.error("Usage: start-run <project_id> <milestone_id>");
          process.exit(1);
        }
        const run = await startRun(projectId, milestoneId);
        console.log(JSON.stringify({ run_id: run.id }));
        break;
      }

      case "finish-run": {
        const [runId, status, ...flags] = args;
        if (!runId || !status) {
          console.error("Usage: finish-run <run_id> <status> [--commit-sha=X] [--error=X] [--logs-file=X]");
          process.exit(1);
        }
        const opts = {};
        for (const flag of flags) {
          if (flag.startsWith("--commit-sha=")) opts.commitSha = flag.split("=", 2)[1];
          else if (flag.startsWith("--error=")) opts.error = flag.split("=").slice(1).join("=");
          else if (flag.startsWith("--logs-file=")) opts.logsFile = flag.split("=", 2)[1];
        }
        await finishRun(runId, status, opts);
        console.log(`Run ${runId} updated to ${status}`);
        break;
      }

      case "complete-milestone": {
        const [milestoneId] = args;
        if (!milestoneId) {
          console.error("Usage: complete-milestone <milestone_id>");
          process.exit(1);
        }
        await completeMilestone(milestoneId);
        console.log(`Milestone ${milestoneId} marked as Done`);
        break;
      }

      case "update-tasks": {
        const [milestoneId, claudeOutputFile] = args;
        if (!milestoneId || !claudeOutputFile) {
          console.error("Usage: update-tasks <milestone_id> <claude_output_file>");
          process.exit(1);
        }
        await updateTasksFromOutput(milestoneId, claudeOutputFile);
        console.log(`Tasks updated for milestone ${milestoneId}`);
        break;
      }

      case "callback": {
        const [netlifyUrl, runId, status] = args;
        if (!netlifyUrl || !runId || !status) {
          console.error("Usage: callback <netlify_url> <run_id> <status>");
          process.exit(1);
        }
        await callback(netlifyUrl, runId, status);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
