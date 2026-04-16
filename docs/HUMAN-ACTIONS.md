# TopNotch — Human Actions Required

> Tasks that **only a human** can complete — credentials, account creation, secrets, manual verification. Organized by milestone. Items marked BLOCKER are **blockers** (the milestone cannot be completed without them). Items marked post-deploy are **deferrable** (can be done after the milestone ships).

---

## From Previous Milestones

Carried over from completed milestones (M8, M10, M14).

| Status | Item | Blocker? | Milestone |
|--------|------|----------|-----------|
| [ ] | **Formspree** — Create account at formspree.io → set form ID in `src/components/ContactForm.astro` (replace `{YOUR_FORM_ID}`) | post-deploy | M10 |
| [ ] | **Umami** — Create account at cloud.umami.is → set website ID in `src/layouts/BaseLayout.astro` (replace `UMAMI_WEBSITE_ID`) | post-deploy | M10 |
| [ ] | **Google Search Console** — Set up for `topnotch.cl` | post-deploy | M14 |
| [ ] | **DNS** — Configure `topnotch.cl` domain to point to Netlify (currently live at `topnotch-cl.netlify.app`) | post-deploy | M14 |
| [ ] | **Responsive QA** — Spot-check at 375px, 768px, 1280px, 1920px | post-deploy | M14 |

---

## M19 — Run History Schema

| Status | Item | Blocker? |
|--------|------|----------|
| [x] | **Apply migration** — Run `supabase db push` to apply `00007_run_history.sql` | BLOCKER |

---

## M20 — GitHub Actions Milestone Runner (OBSOLETE — replaced by Routines in M24)

| Status | Item | Blocker? |
|--------|------|----------|
| [x] | ~~**Anthropic API Key** — Add `ANTHROPIC_API_KEY` to GitHub repo Secrets~~ — **OBSOLETE**: old workflow removed in M27. Runs now use Claude Max subscription via Routines. | — |
| [x] | ~~**First test run** — Trigger the workflow manually from GitHub Actions UI~~ — **OBSOLETE**: old workflow removed in M27. | — |

---

## M21 — Supabase-Aware Runner (OBSOLETE — replaced by Routines in M24)

| Status | Item | Blocker? |
|--------|------|----------|
| [x] | **Supabase Secrets in GitHub** — `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are still needed by `routine-webhook.yml` | — |
| [x] | **Apply migration** — Run `supabase db push` to apply `00007_run_history.sql` (from M19) | — |

---

## M22 — Web Trigger & Monitoring UI (OBSOLETE — replaced by Routines in M24)

| Status | Item | Blocker? |
|--------|------|----------|
| [x] | ~~**GitHub token for website** — Create a GitHub PAT with `actions:write` scope → add to Netlify env vars as `GITHUB_TOKEN`~~ — **OBSOLETE**: replaced by `ROUTINE_BEARER_TOKEN` in M24. | — |

---

## M23 — Human Actions Dashboard

| Status | Item | Blocker? |
|--------|------|----------|
| [ ] | **Apply migration** — Run `supabase db push` to apply `00008_human_actions.sql` | BLOCKER |
| [ ] | **Sync existing actions** — After migration, call `POST /api/human-actions/sync` with this file's content to populate Supabase | post-deploy |

---

## M24 — Routine Setup & Trigger API

| Status | Item | Blocker? |
|--------|------|----------|
| [ ] | **Apply migration** — Run `supabase db push` to apply `00009_run_history_routines.sql` | BLOCKER |
| [ ] | **Create routine** — Go to [claude.ai/code/routines](https://claude.ai/code/routines), click "New routine". Name: "TopNotch Milestone Runner". Prompt: see `docs/ROUTINE-PROMPT.md` below. Repository: `fbascunan/top-notch`. Enable "Allow unrestricted branch pushes" so the routine can push to `main`. Select appropriate cloud environment. | BLOCKER |
| [ ] | **Add API trigger** — Edit the routine, scroll to "Select a trigger", click "Add another trigger", choose "API". Copy the trigger URL (contains the trigger ID like `trig_01XXXXX`). Click "Generate token" and save the bearer token securely — it is shown only once. | BLOCKER |
| [ ] | **Set Netlify env vars** — Go to Netlify dashboard → Site settings → Environment variables. Add: `ROUTINE_TRIGGER_ID` (the `trig_01XXXXX` part from the URL) and `ROUTINE_BEARER_TOKEN` (the `sk-ant-oat01-xxxxx` token). These replace the old `GITHUB_TOKEN`. | BLOCKER |
| [ ] | **Configure cloud environment** — In the routine's cloud environment settings, add env vars needed by the routine (e.g., `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` if the routine needs DB access). Set network access to "Trusted" or "Full". | post-deploy |
| [ ] | **Test fire** — After setting env vars, trigger a test run from the website "Run Milestone" button or from the routine detail page "Run now" button. Verify the routine starts and appears in your sessions at claude.ai/code. | post-deploy |

---

## M26 — Scheduled Routine (Ralph Loop)

| Status | Item | Blocker? |
|--------|------|----------|
| [x] | **Create scheduled routine** — Created via `/schedule` command. Trigger ID: `trig_0163UmuiPJAJ6uaaLLbsWVUC`. Schedule: daily at 13:03 UTC (~9:03 AM Chile). Manage at [claude.ai/code/scheduled](https://claude.ai/code/scheduled/trig_0163UmuiPJAJ6uaaLLbsWVUC) | BLOCKER |
| [ ] | **Verify first scheduled run** — Wait for the next cron fire (13:03 UTC daily), verify the routine picks the right milestone, commits with `[run:scheduled-<timestamp>]` tag, webhook updates Supabase, and UI shows the result | post-deploy |
| [ ] | **Adjust schedule if needed** — If the daily time doesn't work, update the cron at [claude.ai/code/scheduled](https://claude.ai/code/scheduled/trig_0163UmuiPJAJ6uaaLLbsWVUC) | post-deploy |

---

## M27 — Cleanup & Reconciliation

| Status | Item | Blocker? |
|--------|------|----------|
| [ ] | **Remove `ANTHROPIC_API_KEY` from GitHub Secrets** — Go to GitHub repo Settings → Secrets → Actions → delete `ANTHROPIC_API_KEY` (no longer used — routines run under Claude Max subscription) | post-deploy |
| [ ] | **Complete M24 routine setup** — Create routine at claude.ai/code/routines, generate bearer token, set `ROUTINE_TRIGGER_ID` and `ROUTINE_BEARER_TOKEN` in Netlify env vars (see M24 section above) | BLOCKER |
| [ ] | **Verify manual trigger end-to-end** — After routine setup, click "Run Milestone" on the website → verify routine fires, commits with `[run:<id>]` tag, webhook updates Supabase, UI shows result | BLOCKER |
| [ ] | **Verify scheduled trigger end-to-end** — Wait for next cron fire (13:03 UTC daily), verify routine picks correct milestone, commits with `[run:scheduled-<timestamp>]`, webhook updates Supabase | post-deploy |

---

## How to Use This File

1. Before starting a milestone, check if it has BLOCKERs here
2. Complete the blockers before (or during) the milestone
3. Check items off as you complete them
4. Agents: if you discover a new human-required action during implementation, **add it here** instead of burying it in the bitácora

---

_Last updated: 2026-04-15 (M27)_
