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
| [ ] | **Apply migration** — Run `supabase db push` to apply `00007_run_history.sql` | BLOCKER |

---

## M20 — GitHub Actions Milestone Runner

| Status | Item | Blocker? |
|--------|------|----------|
| [ ] | **Anthropic API Key** — Add `ANTHROPIC_API_KEY` to GitHub repo Secrets (Settings → Secrets → Actions) | BLOCKER |
| [ ] | **First test run** — Trigger the workflow manually from GitHub Actions UI to verify end-to-end | BLOCKER |

---

## M21 — Supabase-Aware Runner

| Status | Item | Blocker? |
|--------|------|----------|
| [ ] | **Supabase Secrets in GitHub** — Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to GitHub repo Secrets | BLOCKER |
| [ ] | **Apply migration** — Run `supabase db push` to apply `00007_run_history.sql` (from M19) | BLOCKER |

---

## M22 — Web Trigger & Monitoring UI

| Status | Item | Blocker? |
|--------|------|----------|
| [ ] | **GitHub token for website** — Create a GitHub PAT (or GitHub App) with `actions:write` scope → add to Netlify env vars as `GITHUB_TOKEN` | BLOCKER |

---

## How to Use This File

1. Before starting a milestone, check if it has BLOCKERs here
2. Complete the blockers before (or during) the milestone
3. Check items off as you complete them
4. Agents: if you discover a new human-required action during implementation, **add it here** instead of burying it in the bitácora

---

_Last updated: 2026-04-12_
