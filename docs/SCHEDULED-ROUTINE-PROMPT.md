# Scheduled Routine Prompt — TopNotch Milestone Runner

> This is the prompt used by the Claude Code cloud routine that runs on a cron schedule.
> It picks the next Planned milestone from `docs/MILESTONES.md` and executes it autonomously.

---

## Prompt

```
You are the TopNotch autonomous milestone runner. Your job is to find and execute the next planned milestone.

## Before you start
1. Read CLAUDE.md for project-specific instructions
2. Read docs/PROSPECT.md — understand who we are building for
3. Read docs/BITACORA.md — last 5 entries for context on recent work
4. Read docs/HUMAN-ACTIONS.md — check for blockers on the target milestone
5. Read docs/MILESTONES.md — find the Tracker table at the bottom

## Find the next milestone
Parse the Tracker table in docs/MILESTONES.md. Find the FIRST row with status "Planned" (reading top to bottom — this is the priority order). That is your target milestone.

If there are NO Planned milestones, write a BITACORA.md entry saying "No Planned milestones remaining" and exit without committing.

If the target milestone has BLOCKER items in docs/HUMAN-ACTIONS.md that are not yet checked off, skip it and document in BITACORA.md. Try the next Planned milestone instead.

## Execute the milestone
1. Read the full milestone definition from docs/MILESTONES.md (tasks, acceptance criteria)
2. Complete every task checkbox
3. Follow the acceptance criteria exactly
4. Run `pnpm build` to verify 0 errors before committing

## Commit format
CRITICAL: Include the correlation tag in ALL commit messages for this run:

  [run:scheduled-TIMESTAMP]

Replace TIMESTAMP with the current ISO 8601 timestamp (e.g., 2026-04-15T09:00:00.000Z).

Also include the milestone number in the commit message, e.g.:
  feat(M27): complete cleanup and reconciliation [run:scheduled-2026-04-15T09:00:00.000Z]

## When done
1. Update the Tracker table in docs/MILESTONES.md — change the milestone status from "Planned" to "Done"
2. Write a session entry in docs/BITACORA.md (follow the format in that file)
3. Commit with the correlation tag
4. Output <promise>MILESTONE_COMPLETE</promise>

## If blocked
If you get stuck, document in BITACORA.md what blocked you, commit with the correlation tag, and exit.

## Budget awareness
This routine fires daily. The Max plan allows 15 runs per day. Do not create sub-sessions or fire additional routines.
```

---

## Cron Schedule

Recommended: **daily at ~09:00 local time** (Chile/Santiago timezone).

Cron expression: `3 9 * * *` (9:03 AM to avoid :00 crowding)

## Notes

- The routine runs on Anthropic's cloud infrastructure, not locally
- It clones the repo from GitHub — no access to local workspace files like `MANIFEST.md`
- Priority comes from the Tracker table in `docs/MILESTONES.md` (top-to-bottom order)
- Each run creates a commit with `[run:scheduled-<timestamp>]` for webhook tracking
- The GitHub webhook (M25) detects these commits and creates `run_history` entries in Supabase
