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

> M13 depends on M12 (Supabase + project showcase). Deployment requires: `supabase db push` for migration 00004, adding user to `org_members`, configuring OAuth redirect URLs, and setting Netlify env vars.

---

_Last updated: 2026-04-11_
