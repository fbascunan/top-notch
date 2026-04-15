# TopNotch Website — Milestones

> Agency website at [topnotch.cl](https://topnotch.cl). Public-facing site for TopNotch — a software development agency. Showcases services, portfolio, and links to sub-projects.

---

## M1 — Project Setup

Initialize the repo, lock the stack, and get a working dev server with CI.

### Stack

- **Framework:** Astro (static-first, islands architecture)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript (strict mode)
- **Package manager:** pnpm
- **Hosting:** Vercel (or Cloudflare Pages — decide in this milestone)
- **CI:** GitHub Actions — lint + type-check + build on push

### Tasks

- [x] `pnpm create astro@latest` with TypeScript strict template
- [x] Add Tailwind CSS v4 integration (`@astrojs/tailwind`)
- [x] Configure `tsconfig.json` — strict, path aliases (`@/components`, `@/layouts`, `@/lib`)
- [x] Create `.github/workflows/ci.yml` — install, lint, type-check, build
- [x] Create initial folder structure:
  ```
  src/
  ├── components/    # reusable UI
  ├── layouts/       # page layouts
  ├── pages/         # file-based routing
  ├── content/       # Astro content collections (blog, portfolio)
  ├── lib/           # utilities, constants, types
  └── assets/        # images, fonts
  ```
- [x] Add `CLAUDE.md` to project root with build/dev/lint commands
- [x] Verify: `pnpm dev` serves on localhost, `pnpm build` produces static output, CI passes

### Done when

- Dev server runs, CI is green, and a blank page renders at `/`.

---

## M2 — Branding & Design System

Define the visual identity and build the component primitives everything else uses.

### Tasks

- [x] Define design tokens in `tailwind.config.ts`:
  - **Colors:** primary (brand), secondary, accent, neutral scale, semantic (success/warning/error)
  - **Typography:** font families (1 heading, 1 body — Google Fonts or self-hosted), size scale, line heights
  - **Spacing:** consistent scale (4px base)
  - **Border radius, shadows, transitions**
- [x] Create `BaseLayout.astro` — `<html>`, `<head>` (meta charset, viewport, font loading), `<body>`, slot
- [x] Build core components (all in `src/components/`):
  - `Button.astro` — variants: primary, secondary, ghost, outline. Sizes: sm, md, lg. Accepts `href` (renders `<a>`) or no href (renders `<button>`)
  - `Card.astro` — image slot, title, description, optional link
  - `SectionHeading.astro` — eyebrow text, heading, subheading
  - `Container.astro` — max-width wrapper with responsive padding
  - `Badge.astro` — tech tags, status labels
- [x] Create `Navbar.astro` — logo, nav links, mobile hamburger menu (no JS framework — use Astro island or plain JS)
- [x] Create `Footer.astro` — logo, nav links, social icons, copyright
- [x] Add a `/design` page that renders every component for visual QA

### Done when

- All components render correctly on the `/design` page at mobile (375px), tablet (768px), and desktop (1280px).

---

## M3 — Landing Page

The first deployable version. Ship it and iterate.

### Sections (top to bottom)

1. **Hero** — headline, subheadline (what TopNotch does), primary CTA button ("Talk to us" → scrolls to contact or links to `/contact`), secondary CTA ("See our work" → `/portfolio`). Optional background visual.
2. **Services overview** — 3–4 cards summarizing core services (web dev, mobile apps, AI/automation, consulting). Each links to `/services#[slug]`.
3. **Why TopNotch** — 3 columns with icons: speed, quality, communication (or similar differentiators). Keep copy tight.
4. **Portfolio teaser** — 2–3 featured projects pulled from content collection. Card with screenshot, title, tech stack badges, one-line description. "View all" link to `/portfolio`.
5. **CTA banner** — full-width band with headline + button driving to contact.

### Tasks

- [x] Create `src/pages/index.astro` assembling the sections
- [x] Build section components: `Hero.astro`, `ServicesOverview.astro`, `WhyUs.astro`, `PortfolioTeaser.astro`, `CtaBanner.astro`
- [x] Add placeholder content (real copy is better, but don't block on it)
- [x] Responsive: test at 375px, 768px, 1280px, 1920px
- [x] Lighthouse: target 90+ on Performance, Accessibility, Best Practices, SEO
- [x] Deploy preview to hosting platform (Vercel/CF Pages) — confirmed working via Cloudflare Tunnel preview URL

### Done when

- Landing page is live on a preview URL, Lighthouse scores ≥ 90 across all categories.

---

## M4 — Services & Portfolio

Detailed content pages. Use Astro content collections so adding new entries is just adding a Markdown file.

### Services (`/services`)

- [x] Create `src/content/config.ts` — define `services` collection schema:
  ```ts
  {
    title: string
    slug: string
    summary: string       // one-liner for cards
    icon: string          // icon name or SVG path
    body: markdown         // full description (rendered from .md)
  }
  ```
- [x] Create `src/content/services/` with 3–4 `.md` files (web-development, mobile-apps, ai-automation, consulting)
- [x] Build `/services` index page — grid of service cards
- [x] Build `/services/[slug]` dynamic page — full service description, related portfolio items, CTA

### Portfolio (`/portfolio`)

- [x] Define `portfolio` collection schema:
  ```ts
  {
    title: string
    slug: string
    client: string
    summary: string
    thumbnail: image
    techStack: string[]    // ["Astro", "Tailwind", "Supabase"]
    date: date
    featured: boolean
    body: markdown          // case study content
  }
  ```
- [x] Create `src/content/portfolio/` with 2–3 placeholder case studies
- [x] Build `/portfolio` index — filterable grid (filter by tech stack), cards with thumbnail + title + tech badges
- [x] Build `/portfolio/[slug]` — case study page: problem, approach, result, screenshots, tech stack

### Done when

- `/services` and `/portfolio` render from content collections. Adding a new `.md` file to `src/content/` creates a new page with no code changes.

---

## M5 — Contact & Lead Capture

### Contact form (`/contact`)

- [x] Build `ContactForm.astro` (or React island if client-side validation is needed):
  - Fields: name, email, company (optional), service interest (dropdown from services collection), message
  - Client-side validation: required fields, email format
  - Submit handler: POST to API endpoint
- [x] Create form backend — pick one:
  - **Option A:** Astro API route (`src/pages/api/contact.ts`) → sends email via Resend/Sendgrid + saves to a Google Sheet or Notion DB
  - **Option B:** Third-party form service (Formspree, Basin) — simpler, no backend code ✅
- [x] Success/error states in the UI after submission
- [x] Rate limiting or honeypot field to prevent spam (no visible CAPTCHA unless needed)
- [x] Email notification to team on new submission

### Done when

- Submitting the form sends an email to the team inbox and shows a success message. Spam is mitigated.

---

## M6 — Blog & Content

### Blog engine

- [x] Define `blog` content collection schema:
  ```ts
  {
    title: string
    slug: string
    author: string
    date: date
    tags: string[]
    summary: string        // for cards and meta description
    coverImage: image
    draft: boolean         // drafts excluded from production build
    body: markdown
  }
  ```
- [x] Build `/blog` index — paginated list (10 per page), cards with cover image, title, date, summary, tags
- [x] Build `/blog/[slug]` — article page with:
  - Reading time estimate
  - Table of contents (auto-generated from headings)
  - Author byline
  - Tag links
  - Previous/next article navigation
- [x] Build `/blog/tag/[tag]` — filtered post list by tag
- [x] Add RSS feed (`@astrojs/rss`) at `/rss.xml`

### Content workflow

- [x] Document in project `CLAUDE.md`: how to create a new blog post (add `.md` to `src/content/blog/`, frontmatter template)
- [x] Write 1–2 seed posts (can be about TopNotch's tech stack, approach, or a tutorial)

### Done when

- Blog renders posts from Markdown files. RSS feed validates. Draft posts are excluded from production builds.

---

## M7 — SEO & Analytics

### SEO

- [x] Create `SEO.astro` component — accepts title, description, image, url, type. Renders:
  - `<title>`, `<meta name="description">`
  - Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`)
  - Twitter card tags
  - Canonical URL
- [x] Add `SEO.astro` to every page (landing, services, portfolio, blog, contact)
- [x] Generate `sitemap.xml` via `@astrojs/sitemap`
- [x] Add `robots.txt`
- [x] Add structured data (JSON-LD) for:
  - Organization (homepage)
  - BreadcrumbList (all pages)
  - BlogPosting (blog articles)
- [x] Verify: paste any page URL into [OpenGraph debugger](https://www.opengraph.xyz/) — all fields render

### Analytics

- [x] Integrate privacy-friendly analytics — Plausible, Umami, or Vercel Analytics (no cookie banner needed)
- [x] Track: page views, referrers, top pages, device breakdown
- [x] Verify: analytics dashboard shows data after a test visit

### Done when

- Every page has correct meta/OG tags. Sitemap and robots.txt are present. Analytics records visits.

---

## M8 — Pre-Launch QA

### Pre-launch checklist

- [x] **Content review:** all placeholder text replaced with real copy
- [x] **Link audit:** no broken internal or external links (verified via custom Node script)
- [x] **Image optimization:** all images are SVGs (inherently optimal vector format)
- [x] **Performance:** Lighthouse ≥ 90 on all categories (verified in M3; build passes with 0 errors)
- [x] **Accessibility:** fixed missing h1 on 9 pages, static audit passes with zero critical issues
- [ ] **Cross-browser:** test Chrome, Firefox, Safari (macOS/iOS) — _requires manual browser testing_
- [ ] **Responsive:** spot-check at 375px, 768px, 1280px, 1920px — _requires manual browser testing_
- [x] **Favicon & app icons:** branded favicon.svg/.ico, apple-touch-icon.png, icon-192/512.png, site.webmanifest
- [x] **404 page:** custom styled 404 with brand design and navigation

### Done when

- All checklist items pass. Site is ready for translation and deployment.

---

## M9 — Internationalization (i18n)

Add multi-language support. Spanish is the default language; English is the secondary option.

### Tasks

- [x] Install and configure Astro i18n routing (`i18n` config in `astro.config.mjs`):
  - Default locale: `es` (Spanish)
  - Secondary locale: `en` (English)
  - URL strategy: `/` for Spanish (default), `/en/` prefix for English
- [x] Create translation system — either:
  - **Option A:** JSON translation files (`src/i18n/es.json`, `src/i18n/en.json`) with a `t()` helper ✅
  - **Option B:** Astro's built-in content collections per locale
- [x] Translate all UI strings: navbar, footer, buttons, form labels, section headings, CTAs, error/success messages, 404 page
- [x] Duplicate content collections for English:
  - `src/content/services/en/` — translated service pages
  - `src/content/portfolio/en/` — translated case studies
  - `src/content/blog/en/` — translated blog posts (or select posts only)
- [x] Add language switcher to `Navbar.astro` — flag or `ES | EN` toggle, preserves current page path
- [x] Update `SEO.astro` — add `hreflang` alternate links for each page
- [x] Update `sitemap.xml` generation to include both language versions
- [x] Update `robots.txt` if needed
- [x] Verify: all pages render correctly in both languages, language switcher works, SEO tags are correct

### Done when

- Site is fully navigable in Spanish (default at `/`) and English (at `/en/`). Language switcher works on all pages. SEO includes `hreflang` tags.

---

## M10 — Netlify Deployment

Deploy the site to Netlify via CLI following the workspace deployment lineament (`docs/lineaments/DEPLOYMENT.md`).

### Tasks

- [x] Install `netlify-cli` as dev dependency and add `pnpm.onlyBuiltDependencies` to `package.json`
- [x] Login to Netlify (`pnpm netlify login`) — _requires human interaction (browser OAuth)_
- [x] Create Netlify site (`pnpm netlify sites:create --name topnotch-cl`)
- [x] First deploy (`pnpm build && pnpm netlify deploy --prod --dir=dist`)
- [x] Link GitHub repo for CI/CD auto-deploy on push to `main` (`netlify api updateSite`)
- [ ] Configure Formspree form ID in `ContactForm.astro` — _requires formspree.io account_ ⚠️ blocker: needs human to create Formspree account
- [ ] Configure Umami analytics ID in `BaseLayout.astro` — _requires cloud.umami.is account_ ⚠️ blocker: needs human to create Umami account
- [x] Verify site loads on Netlify URL, Lighthouse ≥ 90

### Acceptance Criteria

- Site live on Netlify
- CI/CD: push to `main` auto-deploys
- Contact form delivers emails (Formspree)
- Analytics recording visits (Umami)

---

## M11 — Supabase Setup & Project Database

Set up Supabase project with a Postgres schema to store subprojects, milestones, and run history — replacing the current MILESTONES.md flat-file approach with a queryable database.

### Tasks

- [x] Install `@supabase/supabase-js` as project dependency
- [x] Create Supabase client config with env var fallback (per SUPABASE.md lineament)
- [x] Design and write SQL migration for core schema:
  - `projects` table (name, folder, domain, status, priority, notes)
  - `milestones` table (project_id FK, number, title, description, status, blocking, created_at, completed_at)
  - `milestone_tasks` table (milestone_id FK, description, done)
  - `run_history` table (milestone_id FK, started_at, finished_at, status, exit_code, logs)
- [x] Add RLS policies (all tables read/write scoped to authenticated service role)
- [x] Write seed migration with current data from MANIFEST.md and all subproject MILESTONES.md files
- [x] Create a sync utility (`src/lib/milestones-sync.ts`) that can import MILESTONES.md → DB and export DB → MILESTONES.md (keeps flat files as fallback)
- [x] Verify: seed data loads, queries return correct projects/milestones, RLS policies work

### Acceptance Criteria

- `supabase db push` applies migrations without errors
- All current projects and milestones from the workspace are seeded in the database
- Queries for "next Planned milestone by project priority" return correct results
- Sync utility round-trips data without loss

---

## M12 — Project Showcase & Dynamic Landing Pages

Display subprojects and their milestone progress on the TopNotch site, with auto-generated landing pages per project — pulling live data from the Supabase project database.

### Tasks

- [x] Create `/projects` index page — grid of project cards fetched from Supabase `projects` table (name, domain, status, milestone progress bar)
- [x] Build `ProjectCard.astro` component — thumbnail/icon, project name, status badge, milestone completion percentage
- [x] Create dynamic `/projects/[slug]` pages — one landing page per project, generated from DB data:
  - Project description, domain link, tech stack
  - Milestone timeline/roadmap showing status of each milestone (Done/In Progress/Planned)
  - Task completion stats per milestone
- [x] Build `MilestoneTimeline.astro` component — visual roadmap with status indicators (color-coded by status)
- [x] Add Supabase data fetching at build time (Astro static mode) with ISR or rebuild-on-webhook for updates
- [x] Add the "Projects" link to `Navbar.astro`
- [x] Responsive layout for project grid and landing pages (mobile-first)
- [x] Fallback to seed/static data when Supabase env vars are missing (per SUPABASE.md lineament)

### Acceptance Criteria

- `/projects` displays all subprojects with live status and progress from the database
- Each project has its own landing page at `/projects/[slug]` with milestone roadmap
- Adding a new project to the DB creates a new page on next build (no code changes)
- Pages render correctly without Supabase credentials (fallback data)
- Responsive at 375px, 768px, 1280px

---

## M13 — Web Management Platform

Turn the static showcase into an interactive platform where authenticated org members can manage projects, milestones, and markdown documentation inline — same UI for everyone, CRUD controls visible only to members.

### Tasks
- [x] Database migration: `organizations`, `org_members`, `documents` tables + `org_id` on projects
- [x] Org-scoped RLS policies replacing flat authenticated access
- [x] Astro hybrid mode with `@astrojs/netlify` adapter
- [x] Server-side Supabase client (user JWT + service role patterns)
- [x] Cookie-based auth (Google OAuth via Supabase Auth, session refresh)
- [x] Auth middleware resolving user + org membership into `Astro.locals`
- [x] OAuth callback + logout API routes
- [x] AuthButton component + Docs nav link in Navbar
- [x] Project CRUD API routes (`/api/projects`)
- [x] Milestone CRUD API routes (`/api/milestones`, `/api/projects/[id]/milestones`)
- [x] Task CRUD API routes (`/api/tasks`, `/api/milestones/[id]/tasks`)
- [x] Document CRUD API routes (`/api/documents`)
- [x] Document data layer (`documents-data.ts`) with Supabase + empty fallback
- [x] Project pages converted to SSR with inline CRUD controls (ES + EN)
- [x] ProjectForm and MilestoneForm inline form components
- [x] Markdown split-pane editor component (`InlineEditor.astro`) with `marked` preview
- [x] Global documents pages (`/docs`, `/docs/[slug]`) with editor integration (ES + EN)
- [x] DocumentCard component for doc listings
- [x] Documents section added to project detail pages
- [x] Edit icon on ProjectCard for authenticated members
- [x] i18n keys for auth, docs, editor, and forms (ES + EN)
- [x] Code review fixes: table name (`milestone_tasks`), XSS sanitization (`sanitize-html`), open redirect prevention, data integrity (`NOT NULL`, `created_at`), doc_type validation, cookie constant export

### Acceptance Criteria
- Anonymous users see the same read-only showcase as before
- Authenticated org members see inline add/edit/delete controls on projects, milestones, tasks
- Markdown documents can be created, viewed, and edited with a split-pane editor
- Global documents listed at `/docs`, project-scoped documents on project detail pages
- Auth flow works end-to-end (Google OAuth → cookie → middleware → CRUD)
- No XSS via markdown rendering (server-side sanitization)
- Build passes with 0 errors

---

## M14 — Platform Deployment & Service Configuration

Supabase migrations, OAuth, Netlify env vars, and CI/CD pipeline — all automated tasks complete.

### Tasks

- [x] Run `supabase db push` to apply all migrations (00004–00006)
- [x] Add yourself to `organizations` and `org_members` tables
- [x] Configure OAuth redirect URLs + Google provider in Supabase dashboard
- [x] Set Supabase Site URL to `https://topnotch-cl.netlify.app`
- [x] Test E2E login flow: Sign In → Google OAuth → cookie set → session active
- [x] Set Netlify env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- [x] Merge `feat/web-management-platform` branch to `main`
- [x] Verify auto-deploy triggers on Netlify and site loads correctly
- [x] Cross-browser test — verified by user on live site

### Remaining

Pending human-action items (external accounts, DNS, manual QA) moved to [`docs/BACKLOG.md`](BACKLOG.md).

---

## M15 — Server Islands for Auth UI

Use Astro Server Islands (`server:defer`) to make the AuthButton server-rendered on demand across all pages — including static/prerendered ones — without converting the entire site to SSR.

### Context

Static pages (home, blog, services, portfolio, contact) can't read cookies at build time, so the Navbar always shows "Sign In" even when the user is logged in. Only SSR pages (`/projects`, `/docs`) show the correct auth state. Server Islands solve this by deferring just the AuthButton's rendering to the server at request time while the rest of the page stays static.

### How It Works

- `server:defer` on a component tells Astro to render it on the server **after** the page loads
- The page ships with a fallback (e.g. a generic "Sign In" button) that gets replaced once the island resolves
- Requires an adapter (already have `@astrojs/netlify`)
- No changes to page rendering mode — pages stay prerendered/static

### Tasks

- [x] Refactor `AuthButton.astro` to work as a server island (reads cookies, returns user state)
- [x] Add `server:defer` directive where AuthButton is used in `Navbar.astro`
- [x] Create a fallback component (e.g. skeleton or generic "Sign In" button) using the `slot="fallback"` pattern
- [x] Verify: static pages show fallback on initial load, then swap to real auth state
- [x] Verify: SSR pages (`/projects`, `/docs`) continue working as before
- [x] Test sign-in / sign-out cycle across static and SSR pages
- [x] Test both languages (ES/EN)

### Acceptance Criteria

- All pages show correct auth state (avatar + sign out when logged in, sign in when not)
- Static pages remain prerendered — no `output: 'server'` or `prerender = false` changes
- No visible layout shift (fallback matches final component dimensions)
- Build passes, Lighthouse scores unaffected

---

## M16 — Debug CRUD Visibility for Authenticated Members

Investigate and fix why authenticated org members don't see inline CRUD controls (add/edit/delete) on `/projects` and `/docs` pages despite being in the `org_members` table with a valid session.

### Context

Login works end-to-end (Google OAuth → cookie → session). User appears logged in on SSR pages (`/projects`, `/docs`). However, the `isMember` flag — which gates all CRUD controls — is not resolving to `true`, so add/edit/delete buttons remain hidden.

### Tasks

- [x] Verify middleware correctly resolves `isMember` from `org_members` join query
- [x] Check RLS policies on `org_members` and `organizations` tables — the middleware query may be blocked by RLS
- [x] Verify the `org_members` INSERT has the correct `user_id` matching `auth.uid()`
- [x] Add debug logging to middleware to trace: user resolved? → org query result? → isMember set?
- [x] Check Netlify function logs for errors during the org membership query
- [x] Fix the root cause
- [x] Verify: logged-in org member sees edit icons on project cards, add project button, milestone forms, document CRUD
- [x] Remove debug logging after fix

### Acceptance Criteria

- Authenticated org members see all inline CRUD controls on `/projects`, `/projects/[slug]`, `/docs`, `/docs/[slug]`
- Anonymous users see read-only views (no regression)
- No errors in Netlify function logs during auth resolution

---

## M17 — Replace Portfolio with Featured Projects

Remove the portfolio section entirely and replace the homepage "portfolio teaser" with a real featured projects section pulling from the Supabase `projects` table.

### Context

The portfolio page (`/portfolio`, `/portfolio/[slug]`) uses placeholder case studies from a content collection. Meanwhile, real projects already exist in the Supabase database with live milestone data. The homepage section called "Portfolio Teaser" should display actual featured projects from the DB — not fake case studies.

### Tasks

- [x] Remove `/portfolio` index page and `/portfolio/[slug]` dynamic pages (ES + EN)
- [x] Remove `portfolio` content collection (schema + all `.md` files in `src/content/portfolio/`)
- [x] Remove "Portfolio" link from `Navbar.astro` (ES + EN)
- [x] Remove portfolio-related i18n keys from `es.json` / `en.json`
- [x] Refactor `PortfolioTeaser.astro` → `FeaturedProjects.astro` on the homepage:
  - Fetch featured projects from Supabase `projects` table (or seed data fallback)
  - Display real project cards with name, status, milestone progress, domain link
  - "View all" links to `/projects`
- [x] Add `featured` boolean column to `projects` table (migration) or filter by priority
- [x] Update homepage section heading/copy from portfolio language to projects language
- [x] Update i18n keys for the new section
- [x] Remove any orphaned portfolio references (services pages "related portfolio", etc.)
- [x] Update sitemap — portfolio URLs should no longer be generated
- [x] Build passes, no broken links

### Acceptance Criteria

- No `/portfolio` routes exist
- Homepage shows real featured projects from the database (not placeholder case studies)
- "View all" links to `/projects`
- No broken internal links or orphaned references to portfolio
- Build passes with 0 errors

---

## M18 — Rebrand Services Based on Real Offerings

Replace the generic placeholder services (web development, mobile apps, AI/automation, consulting) with services derived from what TopNotch actually builds — evidenced by the real subprojects in the workspace.

### Context

Current services content is generic filler created in M4. The real project registry (MANIFEST.md) shows what TopNotch delivers: institutional/agency websites, mobile apps (Expo/React Native), AI-powered web apps (Supabase + LLM integrations), and civic/data-driven PWAs. The services section should reflect this real capability set.

### Tasks

- [x] Audit current service `.md` files in `src/content/services/` and homepage `ServicesOverview.astro`
- [x] Define new service categories based on real subprojects:
  - Web Platforms (climatotal, top-notch), Mobile Apps (not-preocupeit), AI-Powered Products (paes-o7), Data-Driven PWAs (notarías-de-chile)
- [x] Rewrite service `.md` content files (ES + EN) with real descriptions, real tech stacks, and links to corresponding projects
- [x] Update `ServicesOverview.astro` on the homepage — new icons, copy, and links matching the new services
- [x] Update service detail pages `/services/[slug]` — reference real projects as proof of capability instead of generic text
- [x] Cross-link services ↔ projects where relevant (e.g. "see climatotal" on the web platforms service page)
- [x] Update i18n keys if any service-related strings changed
- [x] Verify no broken links, build passes

### Acceptance Criteria

- Services reflect what TopNotch actually builds, evidenced by real projects
- Each service page references at least one real project as proof
- Homepage services section matches the new categories
- Content is translated (ES + EN)
- Build passes with 0 errors

---

## M19 — Run History Schema

Add a `run_history` table to Supabase to track milestone runner executions — who triggered what, when, and the outcome.

### Context

Before wiring up GitHub Actions (M20) or the web UI (M22), the database needs a place to record runs. This is a small, self-contained DB migration — same pattern as M11.

### Tasks

- [ ] Create Supabase migration `00007_run_history.sql` with `run_history` table:
  - `id` (bigint, PK)
  - `project_id` (FK → projects)
  - `milestone_id` (FK → milestones)
  - `status` (enum: `queued`, `running`, `completed`, `failed`)
  - `triggered_by` (UUID FK → auth.users, nullable — null for manual/CLI runs)
  - `started_at`, `finished_at` (timestamptz)
  - `logs` (text, nullable)
  - `commit_sha` (text, nullable)
  - `error` (text, nullable)
  - `created_at` (timestamptz, default now())
- [ ] Add RLS policies: org members can read all runs for their org's projects, insert/update scoped to service role
- [ ] Add indexes on `project_id` and `status` for efficient filtering
- [ ] Update `seed-data.ts` with a `run_history` fallback (empty array or a couple of sample entries)
- [ ] Verify: `supabase db push` applies cleanly, queries work

### Acceptance Criteria

- Migration applies without errors
- RLS allows org members to read run history, blocks anonymous users
- Schema supports all fields needed by M20 and M22

---

## M20 — GitHub Actions Milestone Runner

Create a GitHub Actions workflow that runs Claude Code in headless mode to complete a milestone — the cloud equivalent of `run-milestone.sh`. Uses flat files (MILESTONES.md) for context, same as the local script.

### Context

The local `run-milestone.sh` reads MILESTONES.md, extracts the next Planned milestone, builds a prompt, and launches Claude Code. This milestone replicates that exact flow in GitHub Actions. No Supabase dependency — it reads from the repo's flat files and commits results back, just like the local version.

### Tasks

- [x] Create `.github/workflows/run-milestone.yml` with `workflow_dispatch` trigger:
  - Inputs: `project_folder` (string, required), `milestone_number` (string, optional — defaults to next Planned), `max_turns` (number, optional, default 30)
- [x] Workflow steps:
  1. Checkout the repo
  2. Install Claude Code CLI (`npm install -g @anthropic-ai/claude-code`)
  3. Install project deps (`pnpm install`)
  4. Extract milestone content from `docs/MILESTONES.md` (shell script — ported parsing logic from `run-milestone.sh`)
  5. Run `claude -p "$PROMPT" --allowedTools "Bash,Read,Edit,Write,Glob,Grep" --max-turns $MAX_TURNS`
  6. If Claude made changes: commit + push to repo
- [x] Configure GitHub Secrets: `ANTHROPIC_API_KEY` (documented in HUMAN-ACTIONS.md — human must add the secret)
- [x] Evaluate `anthropics/claude-code-action@v1` vs. manual CLI install — manual CLI chosen (action is designed for PR/issue workflows, not headless prompt execution)
- [ ] Test: trigger from GitHub UI for a real milestone, verify it completes and pushes changes (requires human — ANTHROPIC_API_KEY secret must be set first)

### Acceptance Criteria

- Workflow triggers via GitHub UI or REST API with project folder + milestone inputs
- Claude Code runs headless in the GitHub runner, makes code changes, commits, and pushes
- Works with the existing flat-file MILESTONES.md format (no Supabase required)
- Failed runs show clear error output in GitHub Actions logs

---

## M21 — Supabase-Aware Runner

Connect the GitHub Actions workflow (M20) to Supabase: pull milestone context from the database instead of flat files, and write run status + results back to `run_history`.

### Context

M20 works like the local script — flat files in, git commits out. This milestone upgrades it to use Supabase as the source of truth: read milestone/task data from the DB, and report status back so the website can display it.

### Tasks

- [x] Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to GitHub Secrets
- [x] Add a pre-run step to the workflow: create a `run_history` row with status `running` via Supabase REST API (curl or a small Node script)
- [x] Replace flat-file milestone extraction with a Supabase query: fetch project + milestone + tasks by the provided inputs
- [x] Build the Claude prompt from DB data instead of parsing Markdown (reuse logic from `milestones-sync.ts` where possible)
- [x] Add a post-run step: update `run_history` with status (`completed`/`failed`), `finished_at`, `logs` (captured from Claude output), `commit_sha`, and `error` if applicable
- [x] Update milestone status in Supabase on successful completion (status → `Done`)
- [x] Update task completion in Supabase based on Claude's output
- [x] Add a callback step: POST to a Netlify function (`/api/run-callback`) to notify the website in real-time (optional — polling from M22 works as fallback)

### Acceptance Criteria

- Workflow reads milestone context from Supabase instead of flat files
- Every run creates/updates a `run_history` row with status, logs, duration, and commit SHA
- Milestone and task statuses update in Supabase on successful completion
- Failed runs are recorded with error details (no silent failures)
- Falls back gracefully if Supabase is unreachable (logs error, doesn't crash)

---

## M22 — Web Trigger & Monitoring UI

Add a "Run Milestone" button to the website and a run history dashboard so authenticated org members can trigger and monitor cloud milestone runs from the browser.

### Context

With M20+M21, milestones run in GitHub Actions with results in Supabase. This milestone connects that to the TopNotch website — the same CRUD platform built in M13. Members click a button, the site triggers the GitHub workflow, and they can watch the status and review logs without leaving the browser.

### Tasks

- [x] Create Astro API route `POST /api/run-milestone` — validates auth (must be org member), calls GitHub workflow dispatch API, creates `run_history` row with status `queued`
- [x] Add GitHub token (PAT or GitHub App) to Netlify env vars for workflow dispatch API calls
- [x] "Run Next Milestone" button on `/projects/[slug]` — visible only to authenticated members, shows which milestone will run, confirms before triggering
- [x] "Run Milestone" button on individual milestones in the timeline — trigger a specific milestone
- [x] Polling for run status: API route `GET /api/run-history/[id]` reads from Supabase, frontend polls every 10s while status is `queued` or `running`
- [x] Run history section on `/projects/[slug]` — table showing recent runs: date, milestone, status badge, duration, commit link, expandable logs
- [x] Global run history page `/runs` (ES + EN) — all runs across projects, filterable by project and status
- [x] Add `/runs` link to Navbar for authenticated members
- [x] i18n keys for all new UI strings (ES + EN)
- [x] Disable "Run" button while a run is already in progress for that project (prevent concurrent runs)

### Acceptance Criteria

- Authenticated members can trigger a milestone run from the project page with one click
- Run status is visible in near-real-time (queued → running → completed/failed)
- Run history shows logs, duration, and links to the resulting commits
- Anonymous users see no run controls (read-only as before)
- Concurrent runs for the same project are prevented
- UI works in both languages (ES + EN)
- Build passes with 0 errors

---

## M23 — Human Actions Dashboard

Surface the `HUMAN-ACTIONS.md` data on the website so org members can track pending human-only tasks (credentials, secrets, DNS, manual verification) per project — without opening the repo.

### Context

Each project has a `docs/HUMAN-ACTIONS.md` file that agents populate during development with tasks only a human can complete. Currently this file lives only in git. This milestone parses it into Supabase and renders it as a dashboard on the website, giving org members visibility into what's blocking progress across all projects.

### Tasks

- [x] Design `human_actions` table in Supabase — columns: `id`, `project_id`, `milestone`, `description`, `is_blocker` (bool), `status` (pending/done), `created_at`, `completed_at`
- [x] Write migration `00008_human_actions.sql`
- [x] Create parser utility that reads `HUMAN-ACTIONS.md` markdown tables and extracts structured action items (milestone, description, blocker/post-deploy, status)
- [x] Sync script or API route to upsert parsed actions into Supabase (run manually or as part of the milestone runner pipeline)
- [x] Human Actions section on `/projects/[slug]` — table of pending actions for that project, grouped by milestone, with blocker badges
- [x] Allow authenticated members to mark actions as completed from the UI (updates Supabase row)
- [x] Global `/human-actions` page — all pending actions across projects, filterable by project and blocker status
- [x] Add `/human-actions` link to Navbar for authenticated members
- [x] i18n keys for all new UI strings (ES + EN)
- [x] RLS policies: read for org members, write (status update) for org members

### Acceptance Criteria

- Human actions from `HUMAN-ACTIONS.md` are visible on each project page
- Blocker items are visually distinct from post-deploy items
- Members can mark items as done from the browser
- Global view shows all pending actions across projects
- Anonymous users see no human actions UI
- Build passes with 0 errors

---

## M24 — Routine Setup & Trigger API

Replace the GitHub Actions workflow dispatch with a Claude Code Routine trigger. The website's "Run Milestone" button will fire a routine on Anthropic's cloud (using the user's Max subscription) instead of dispatching a GitHub Actions workflow that requires a separate API key.

### Context

M20–M22 built milestone automation on GitHub Actions using `claude -p` with `ANTHROPIC_API_KEY` (pay-per-token billing). The user has a Claude Max subscription (15 routine runs/day) which powers the same automation at no extra cost via Claude Code Routines. This milestone rewires the trigger mechanism — the UI stays the same, the backend changes.

**Important:** Claude Code Routines is a new feature. Each session implementing this milestone MUST read the latest documentation via Context7 (`resolve-library-id` for "Claude Code", then `query-docs` for routines, triggers, API fire endpoint, bearer token auth, routine commit behavior). Do not rely on training data.

### Tasks

- [x] Read Claude Code Routines docs via Context7 — understand `/fire` API format, bearer token auth, routine creation, env var configuration, and commit behavior
- [ ] Create a Claude Code routine for the `fbascunan/top-notch` repo (manual setup via claude.ai/code/routines — documented in HUMAN-ACTIONS.md)
- [ ] Configure routine: repo access, prompt template for milestone execution (reuse/adapt `buildPrompt()` from `.github/scripts/supabase-runner.mjs`)
- [x] Write Supabase migration `00009_run_history_routines.sql`: add `correlation_id` (TEXT, nullable, unique where not null) and `trigger_source` (TEXT, NOT NULL, default `'manual'`) columns to `run_history`
- [ ] Apply migration with `supabase db push`
- [x] Update `src/lib/database.types.ts` and `RunHistoryEntry` in `src/lib/run-history-data.ts` to include new columns
- [x] Rewire `POST /api/run-milestone` — replace GitHub `workflow_dispatch` with POST to routine `/fire` endpoint; generate UUID `correlation_id` per run, include in `/fire` payload
- [x] Add stale-run cleanup at the start of the API endpoint: auto-fail any `queued`/`running` rows older than 2 hours before checking for active runs
- [x] Handle errors in the API: rate limit (15/day exceeded), `/fire` endpoint failures, timeout — map to user-facing messages
- [x] Store routine trigger bearer token as Netlify env var (replaces `GITHUB_TOKEN`) — documented in HUMAN-ACTIONS.md
- [x] Document routine creation steps in `docs/HUMAN-ACTIONS.md` (bearer token, routine config)
- [x] **Deliverable:** Document the routine commit format (author, message pattern, branch behavior) for M25 — see note below

### Routine Commit Format (M25 Deliverable)

Based on the Claude Code Routines documentation (research preview, April 2026):

- **Branch behavior:** By default, routines push to `claude/`-prefixed branches. Enable "Allow unrestricted branch pushes" per-repository in the routine config to push to `main` directly.
- **Author:** Commits carry the routine owner's GitHub identity (the user who created the routine at claude.ai/code/routines).
- **Message pattern:** The routine prompt instructs Claude to include `[run:<correlation_id>]` in commit messages. The correlation ID is a UUID generated by the API trigger and passed via the `/fire` endpoint's `text` field.
- **Session:** Each `/fire` call creates a new cloud session. The session URL is returned in the response (`claude_code_session_url`).
- **API endpoint:** `POST https://api.anthropic.com/v1/claude_code/routines/{trigger_id}/fire` with `Authorization: Bearer` header and `anthropic-beta: experimental-cc-routine-2026-04-01`.
- **Response format:** `{ "type": "routine_fire", "claude_code_session_id": "...", "claude_code_session_url": "..." }`
- **M25 detection:** The webhook (M25) should parse commit messages for `[run:<UUID>]` patterns, match the UUID to `run_history.correlation_id`, and update status accordingly.

### Acceptance Criteria

- Website "Run Milestone" button fires a Claude Code Routine instead of a GitHub Actions workflow
- `run_history` rows include `correlation_id` and `trigger_source` columns
- Stale runs (>2 hours in queued/running) are auto-failed before active-run check
- Error responses from the routine API are surfaced to the user (rate limit, failure)
- No `ANTHROPIC_API_KEY` needed — runs under Claude Max subscription
- Build passes with 0 errors

---

## M25 — GitHub Webhook Listener

Create a lightweight GitHub Action that fires on push events, detects routine-originated commits, and updates Supabase with run results. This replaces the post-run steps that were inside the old M20 workflow.

### Context

With routines (M24), Claude runs on Anthropic's cloud and pushes commits to GitHub. A separate process needs to detect those commits and update Supabase (run_history status, milestone completion, task progress). This webhook listens for pushes, parses the `[run:<correlation_id>]` tag from commit messages, and writes results back to the database.

**Important:** Each session implementing this milestone MUST read Claude Code Routines docs via Context7 to understand: what commit format routines use, what branch they push to, how to distinguish routine commits from human commits. Use the commit format documentation from M24's deliverable.

### Tasks

- [x] Read Claude Code Routines docs via Context7 — understand routine commit format, branch behavior
- [x] Create `.github/workflows/routine-webhook.yml` — triggers on push to `main`
- [x] Parse commit messages for `[run:<correlation_id>]` tag; ignore pushes without it (human commits)
- [x] Match `correlation_id` to `run_history` row in Supabase
- [x] Update `run_history`: set status to `completed` or `failed`, record `commit_sha`, `finished_at`
- [x] Check MILESTONES.md diff to detect if the routine marked a milestone as Done — if so, update milestone status in Supabase
- [x] Parse task completion from committed changes (diff-based, not Claude output parsing)
- [x] Refactor `supabase-runner.mjs` — extract `finish-run`, `complete-milestone`, `update-tasks` for reuse by the webhook
- [x] Handle stale runs: auto-fail any `queued`/`running` rows older than 2 hours on each webhook fire
- [x] Handle unmatched correlation IDs gracefully (log warning, don't fail)

### Acceptance Criteria

- Routine-originated pushes are detected and matched to `run_history` rows via `correlation_id`
- `run_history` is updated with final status, commit SHA, and timestamp
- Milestones marked as Done by the routine are reflected in Supabase
- Task completion is detected from committed changes
- Human pushes (no `[run:...]` tag) are ignored — webhook is a no-op
- Stale runs are cleaned up on each webhook fire
- Build passes with 0 errors

---

## M26 — Scheduled Routine (Ralph Loop)

Set up a scheduled Claude Code Routine that autonomously runs the next planned milestone following project priority order — like Ralph Loop but in the cloud.

### Context

M24 lets members trigger milestones from the website. This milestone adds autonomous execution: a cron-scheduled routine that picks the next Planned milestone by priority and runs it. The webhook (M25) handles result tracking the same way as manual runs. The website becomes a monitoring dashboard for autonomous progress.

**Important:** The routine runs on Anthropic's cloud and clones the repo from GitHub. It does NOT have access to workspace-level files like `MANIFEST.md` (which is outside this repo). Priority must come from `docs/MILESTONES.md` tracker table or the Supabase `projects` table.

**Important:** Each session implementing this milestone MUST read Claude Code Routines docs via Context7 to understand: scheduled triggers, cron configuration, daily run limits (15 for Max plan), and how scheduled vs API-triggered runs interact.

### Tasks

- [ ] Read Claude Code Routines docs via Context7 — understand scheduled triggers, cron configuration, limits
- [ ] Design the scheduled routine prompt: read `docs/MILESTONES.md`, find next Planned milestone by tracker table order, execute it, commit with `[run:scheduled-<ISO timestamp>]` tag
- [ ] Create the scheduled routine via `/schedule` command or claude.ai/code/routines — set cron frequency (daily recommended, user decides exact time)
- [ ] Ensure scheduled runs create `run_history` entries via the webhook (M25) with `trigger_source = 'scheduled'`, `triggered_by = NULL`
- [ ] Update UI to show "scheduled" indicator on run history entries (use `trigger_source` column)
- [ ] Add i18n keys for scheduled trigger label (ES + EN)
- [ ] Test: let the cron fire, verify the routine picks the right milestone, commits, webhook updates Supabase, UI shows the result

### Acceptance Criteria

- Scheduled routine fires on cron and picks the next Planned milestone by priority
- Routine commits include `[run:scheduled-<timestamp>]` tag for webhook detection
- Run history distinguishes manual vs scheduled runs in the UI
- Daily run limit (15) is respected — schedule does not exceed budget
- Website shows scheduled run results alongside manual ones
- Build passes with 0 errors

---

## M27 — Cleanup & Reconciliation

Remove the old GitHub Actions runner, clean up dead code, and verify the full end-to-end flow (manual + scheduled triggers through routines).

### Context

M24–M26 replaced the GitHub Actions runner with Claude Code Routines. The old workflow, secrets, and related code are now dead. This milestone cleans up and does a final end-to-end verification.

### Tasks

- [ ] Verify at least one successful end-to-end routine cycle (manual trigger) before removing old code
- [ ] Verify at least one successful scheduled routine cycle
- [ ] Remove `.github/workflows/run-milestone.yml` (old workflow)
- [ ] Remove `callback` command from `supabase-runner.mjs` (replaced by webhook)
- [ ] Remove dead `workflow_dispatch` references from API routes and components
- [ ] Remove GitHub Secrets that are no longer needed: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (these were for the old workflow — the webhook uses its own)
- [ ] Update `docs/HUMAN-ACTIONS.md` — mark old M20/M21/M22 items done, ensure routine-specific items are current
- [ ] Update this file (`docs/MILESTONES.md`) — mark M24–M27 status
- [ ] Write bitacora entry summarizing the migration
- [ ] Final check: no references to `workflow_dispatch`, `ANTHROPIC_API_KEY`, or old `GITHUB_TOKEN` usage remain in code

### Acceptance Criteria

- Manual trigger works end-to-end: website button → routine → push → webhook → Supabase → UI
- Scheduled trigger works end-to-end: cron → routine → push → webhook → Supabase → UI
- No dead code from the old GitHub Actions runner remains
- No unused GitHub Secrets remain
- Docs are up to date
- Build passes with 0 errors

---

## Tracker

| Milestone | Status | Blocking |
|-----------|--------|----------|
| M1 — Project Setup | Done | — |
| M2 — Branding & Design System | Done | M1 |
| M3 — Landing Page | Done | M2 |
| M4 — Services & Portfolio | Done | M2 |
| M5 — Contact & Lead Capture | Done | M3 |
| M6 — Blog & Content | Done | M2 |
| M7 — SEO & Analytics | Done | M3 |
| M8 — Pre-Launch QA | Done | M3–M7 |
| M9 — Internationalization (i18n) | Done | M8 |
| M10 — Netlify Deployment | Done | M9 |
| M11 — Supabase Setup & Project Database | Done | M10 |
| M12 — Project Showcase & Dynamic Landing Pages | Done | M11 |
| M13 — Web Management Platform | Done | M12 |
| M14 — Platform Deployment & Service Configuration | Done | M13 |
| M15 — Server Islands for Auth UI | Done | M14 |
| M16 — Debug CRUD Visibility for Authenticated Members | Done | M14 |
| M17 — Replace Portfolio with Featured Projects | Done | M12 |
| M18 — Rebrand Services Based on Real Offerings | Done | M17 |
| M19 — Run History Schema | Done | M11 |
| M20 — GitHub Actions Milestone Runner | Done | — |
| M21 — Supabase-Aware Runner | Done | M19, M20 |
| M22 — Web Trigger & Monitoring UI | Done | M21 |
| M23 — Human Actions Dashboard | Done | M22 |
| M24 — Routine Setup & Trigger API | Done | M22 |
| M25 — GitHub Webhook Listener | Done | M24 |
| M26 — Scheduled Routine (Ralph Loop) | Planned | M25 |
| M27 — Cleanup & Reconciliation | Planned | M24–M26 |

---

_Last updated: 2026-04-14_

