# Routines Migration — Design Spec

> Migrate TopNotch milestone automation from GitHub Actions + API key to Claude Code Routines (subscription-based, Anthropic cloud).

## Problem

M20–M22 built a milestone runner pipeline on GitHub Actions using `claude -p` with `ANTHROPIC_API_KEY`. This requires separate API billing (pay-per-token). The user has a Claude Max subscription (15 routine runs/day) which can power the same automation at no extra cost via Claude Code Routines.

## Decision

Replace the GitHub Actions-based runner with Claude Code Routines. Keep the existing web UI (run buttons, status badges, run history, polling) and Supabase schema. Rewire the trigger backend and result tracking.

## Architecture

```
Website (run button)
    │
    ▼
POST /api/run-milestone
    ├── 1. Create run_history row (status: "queued", correlation_id: uuid)
    ├── 2. POST to Routine /fire endpoint (pass correlation_id in payload)
    └── 3. Return run_id to frontend
                                │
                                ▼
                        Claude Code Routine
                        (Anthropic cloud, clones repo)
                        Prompt includes: correlation_id
                        Commit message includes: [run:<correlation_id>]
                                │
                                ▼
                        git push to GitHub
                                │
                                ▼
                        GitHub Action (webhook on push)
                        Parses [run:<correlation_id>] from commit
                        Matches to run_history row
                                │
                                ▼
                        Update Supabase
                        (run_history, milestones, tasks)
                                │
                                ▼
                        Website polls /api/run-history/[id]
                        UI updates automatically
```

### Scheduled Flow

```
Cron (e.g., daily) ──► Scheduled Routine
                            │
                            ▼
                    Read docs/MILESTONES.md + Supabase projects table
                    Pick next planned milestone by priority
                    Run it (same push → webhook → Supabase flow)
                    Commit includes: [run:scheduled-<timestamp>]
```

### Correlation Strategy

Every routine run gets a `correlation_id` (UUID) that flows through the entire pipeline:
1. **API route** creates it and stores in `run_history`
2. **Routine `/fire` payload** includes it as context text
3. **Routine prompt** instructs Claude to include `[run:<correlation_id>]` in commit messages
4. **Webhook** parses the tag from commit messages and matches to `run_history`

For scheduled runs (no API trigger), the routine generates its own correlation ID as `scheduled-<ISO timestamp>`.

## Schema Change

Add `correlation_id` (TEXT, nullable, indexed) and `trigger_source` (TEXT, default `'manual'`) to `run_history`:

```sql
ALTER TABLE run_history ADD COLUMN correlation_id TEXT;
ALTER TABLE run_history ADD COLUMN trigger_source TEXT NOT NULL DEFAULT 'manual';
CREATE UNIQUE INDEX idx_run_history_correlation ON run_history(correlation_id) WHERE correlation_id IS NOT NULL;
```

`trigger_source` values: `'manual'` (website button), `'scheduled'` (cron routine).
`triggered_by` remains a UUID FK to auth.users — null for scheduled runs.

## Milestones

Note: M23 ("Human Actions Dashboard") already exists in MILESTONES.md. These new milestones start at M24.

### M24 — Routine Setup & Trigger API

**Goal:** Replace GitHub Actions dispatch with Claude Code routine trigger.

**Scope:**
- Create a Claude Code routine for the TopNotch repo (manual setup via `/schedule` or claude.ai/code/routines)
- Configure routine: repo access, prompt template for milestone execution
- Rewire `POST /api/run-milestone` to POST to the routine's `/fire` API endpoint instead of GitHub `workflow_dispatch`
- Generate a `correlation_id` (UUID) per run, include in `/fire` payload and store in `run_history`
- Store routine trigger bearer token as Netlify env var (replaces `GITHUB_TOKEN`)
- Apply schema migration: add `correlation_id` and `trigger_source` columns to `run_history`
- Handle errors: rate limit (15/day exceeded), `/fire` endpoint failures, timeout on the POST
- Map error responses to user-facing messages in the API response
- Add stale-run cleanup at the start of the API endpoint: auto-fail any `queued`/`running` rows older than 2 hours before checking for active runs
- Update `src/lib/database.types.ts` and `RunHistoryEntry` in `src/lib/run-history-data.ts` to include new columns
- **Deliverable:** Document the routine commit format (author, message pattern, branch behavior) after reading the docs — M25 depends on this

**Context requirement:** Each session implementing this milestone MUST read Claude Code Routines documentation via Context7 (`resolve-library-id` for "Claude Code", then `query-docs` for routines, triggers, API fire endpoint, bearer token auth, routine commit behavior). Do not rely on training data — the routines feature is new and the API surface may have changed.

**What changes:**
- `src/pages/api/run-milestone.ts` — swap GitHub dispatch for routine `/fire` POST, add correlation_id generation
- New Supabase migration — `correlation_id` and `trigger_source` columns
- Netlify env vars — replace `GITHUB_TOKEN` with routine bearer token
- `docs/HUMAN-ACTIONS.md` — new entry for routine creation + bearer token setup

**What stays:**
- `run_history` table structure (extended, not replaced)
- UI components (run buttons, status badges)
- Frontend polling logic

---

### M25 — GitHub Webhook Listener

**Goal:** Track routine results in Supabase via a lightweight GitHub Action triggered on push.

**Scope:**
- Create `.github/workflows/routine-webhook.yml` — triggers on push to main
- Detect routine-originated pushes by parsing `[run:<correlation_id>]` from commit messages
- Match `correlation_id` to `run_history` row in Supabase
- Reuse update logic from `supabase-runner.mjs`: `finish-run`, `complete-milestone`, `update-tasks`
- Update `run_history` with: status (completed/failed), commit SHA, finished_at timestamp
- Mark milestone as Done if the routine completed it (check MILESTONES.md diff)
- Parse task completion from committed changes (diff-based)
- Handle stale runs: if a `run_history` row has been in `queued` or `running` for >2 hours, auto-fail it
- Ignore pushes that don't contain `[run:...]` tags (human pushes)

**Context requirement:** Each session implementing this milestone MUST read Claude Code Routines documentation via Context7 to understand: what commit format routines use, what branch they push to, how to distinguish routine commits from human commits. Use the commit format documentation from M24's deliverable.

**What changes:**
- New `.github/workflows/routine-webhook.yml`
- Refactor `supabase-runner.mjs` for reuse by the webhook (or extract shared functions)

**What stays:**
- Supabase schema (migration already applied in M24)
- `supabase-runner.mjs` core logic (reused)

---

### M26 — Scheduled Routine (Ralph Loop)

**Goal:** Autonomous milestone execution following project priority order.

**Scope:**
- Create a scheduled routine (cron — daily or configurable) that:
  1. Reads `docs/MILESTONES.md` in the repo to find all milestones and their status
  2. Queries Supabase `projects` table for priority order (or reads priority from MILESTONES.md tracker table)
  3. Picks the next "Planned" milestone by priority
  4. Runs that milestone
  5. Commits with `[run:scheduled-<ISO timestamp>]` tag
- Website becomes a monitoring dashboard — shows scheduled runs in run history
- Scheduled runs: `trigger_source = 'scheduled'`, `triggered_by = NULL`
- Webhook (M25) handles result tracking the same way as manual runs

**Context requirement:** Each session implementing this milestone MUST read Claude Code Routines documentation via Context7 to understand: scheduled triggers, cron configuration, daily run limits (15 for Max plan), and how scheduled vs API-triggered runs interact.

**Important:** The routine runs on Anthropic's cloud and clones the repo from GitHub. It does NOT have access to the workspace-level `MANIFEST.md` (which is outside this repo). Priority must come from either `docs/MILESTONES.md` tracker table or the Supabase `projects` table.

**What changes:**
- New scheduled routine configuration
- UI: "scheduled" indicator on run history entries via `trigger_source`

**What stays:**
- All existing UI components
- Webhook listener from M25
- API trigger from M24

---

### M27 — Cleanup & Reconciliation

**Goal:** Remove dead code, verify end-to-end, update docs.

**Scope:**
- Remove `.github/workflows/run-milestone.yml` (old workflow) — keep it through one successful end-to-end routine cycle first, then delete
- Remove `ANTHROPIC_API_KEY` and `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` from GitHub Secrets (no longer needed for the old workflow)
- Clean up any dead code in API routes, data layer, or components
- Remove the `callback` command from `supabase-runner.mjs` (replaced by webhook)
- Update `docs/HUMAN-ACTIONS.md` — mark old items done, add routine-specific items
- Update `docs/MILESTONES.md` — add M24-M27, mark status
- Write bitacora entry
- End-to-end verification:
  - Manual trigger: website button → routine → push → webhook → Supabase → UI shows result
  - Scheduled trigger: cron fires → routine → push → webhook → Supabase → UI shows result

**What gets removed:**
- Old `run-milestone.yml` workflow
- `ANTHROPIC_API_KEY` GitHub secret
- `GITHUB_TOKEN` from Netlify (replaced by routine bearer token)
- Dead `workflow_dispatch` references
- `callback` command in `supabase-runner.mjs`

---

## Constraints

- **15 runs/day** (Max plan) — sufficient for milestone runs but schedule should be conservative
- **Routine runs on Anthropic cloud** — clones repo from GitHub, cannot access local files or workspace-level files
- **No API key needed** — runs under Claude subscription
- **Single repo** — routine operates on `fbascunan/top-notch` only; multi-repo would need separate routines

## Resolved Design Decisions

- **Correlation:** UUID `correlation_id` flows through API → routine prompt → commit message → webhook → Supabase
- **Trigger source tracking:** New `trigger_source` column (TEXT) instead of overloading `triggered_by` (UUID FK)
- **Priority source:** `docs/MILESTONES.md` tracker table or Supabase `projects.priority` — NOT workspace-level `MANIFEST.md`
- **Stale run cleanup:** Webhook auto-fails runs stuck in queued/running for >2 hours
- **Old workflow removal:** Staged — keep through first successful routine cycle, then delete in M27
- **Prompt template:** Reuse/adapt `buildPrompt()` from existing `supabase-runner.mjs`

## Open Questions

- Exact routine `/fire` API format — must be confirmed from docs at implementation time (M24 deliverable)
- Routine commit format (author, message, branch) — must be documented during M24
- Whether routine env vars support Supabase credentials — determines if routine can query DB directly or relies on flat files
- Cron frequency for M26 — daily? twice daily? User to decide at implementation time

## User Context

- Claude Max subscription (15 runs/day)
- Wants both on-demand (website buttons) and scheduled (Ralph Loop style) triggers
- Scheduled routine follows project priority order from MILESTONES.md / Supabase
- Webhook updates Supabase (separation of concerns — routine codes, webhook tracks)
- User doesn't care about old GitHub Actions code — can delete or keep as needed
