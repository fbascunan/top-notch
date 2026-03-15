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

- [ ] Create `src/pages/index.astro` assembling the sections
- [ ] Build section components: `Hero.astro`, `ServicesOverview.astro`, `WhyUs.astro`, `PortfolioTeaser.astro`, `CtaBanner.astro`
- [ ] Add placeholder content (real copy is better, but don't block on it)
- [ ] Responsive: test at 375px, 768px, 1280px, 1920px
- [ ] Lighthouse: target 90+ on Performance, Accessibility, Best Practices, SEO
- [ ] Deploy preview to hosting platform (Vercel/CF Pages) — confirm it works at a preview URL

### Done when

- Landing page is live on a preview URL, Lighthouse scores ≥ 90 across all categories.

---

## M4 — Services & Portfolio

Detailed content pages. Use Astro content collections so adding new entries is just adding a Markdown file.

### Services (`/services`)

- [ ] Create `src/content/config.ts` — define `services` collection schema:
  ```ts
  {
    title: string
    slug: string
    summary: string       // one-liner for cards
    icon: string          // icon name or SVG path
    body: markdown         // full description (rendered from .md)
  }
  ```
- [ ] Create `src/content/services/` with 3–4 `.md` files (web-development, mobile-apps, ai-automation, consulting)
- [ ] Build `/services` index page — grid of service cards
- [ ] Build `/services/[slug]` dynamic page — full service description, related portfolio items, CTA

### Portfolio (`/portfolio`)

- [ ] Define `portfolio` collection schema:
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
- [ ] Create `src/content/portfolio/` with 2–3 placeholder case studies
- [ ] Build `/portfolio` index — filterable grid (filter by tech stack), cards with thumbnail + title + tech badges
- [ ] Build `/portfolio/[slug]` — case study page: problem, approach, result, screenshots, tech stack

### Done when

- `/services` and `/portfolio` render from content collections. Adding a new `.md` file to `src/content/` creates a new page with no code changes.

---

## M5 — Contact & Lead Capture

### Contact form (`/contact`)

- [ ] Build `ContactForm.astro` (or React island if client-side validation is needed):
  - Fields: name, email, company (optional), service interest (dropdown from services collection), message
  - Client-side validation: required fields, email format
  - Submit handler: POST to API endpoint
- [ ] Create form backend — pick one:
  - **Option A:** Astro API route (`src/pages/api/contact.ts`) → sends email via Resend/Sendgrid + saves to a Google Sheet or Notion DB
  - **Option B:** Third-party form service (Formspree, Basin) — simpler, no backend code
- [ ] Success/error states in the UI after submission
- [ ] Rate limiting or honeypot field to prevent spam (no visible CAPTCHA unless needed)
- [ ] Email notification to team on new submission

### Done when

- Submitting the form sends an email to the team inbox and shows a success message. Spam is mitigated.

---

## M6 — Blog & Content

### Blog engine

- [ ] Define `blog` content collection schema:
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
- [ ] Build `/blog` index — paginated list (10 per page), cards with cover image, title, date, summary, tags
- [ ] Build `/blog/[slug]` — article page with:
  - Reading time estimate
  - Table of contents (auto-generated from headings)
  - Author byline
  - Tag links
  - Previous/next article navigation
- [ ] Build `/blog/tag/[tag]` — filtered post list by tag
- [ ] Add RSS feed (`@astrojs/rss`) at `/rss.xml`

### Content workflow

- [ ] Document in project `CLAUDE.md`: how to create a new blog post (add `.md` to `src/content/blog/`, frontmatter template)
- [ ] Write 1–2 seed posts (can be about TopNotch's tech stack, approach, or a tutorial)

### Done when

- Blog renders posts from Markdown files. RSS feed validates. Draft posts are excluded from production builds.

---

## M7 — SEO & Analytics

### SEO

- [ ] Create `SEO.astro` component — accepts title, description, image, url, type. Renders:
  - `<title>`, `<meta name="description">`
  - Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`)
  - Twitter card tags
  - Canonical URL
- [ ] Add `SEO.astro` to every page (landing, services, portfolio, blog, contact)
- [ ] Generate `sitemap.xml` via `@astrojs/sitemap`
- [ ] Add `robots.txt`
- [ ] Add structured data (JSON-LD) for:
  - Organization (homepage)
  - BreadcrumbList (all pages)
  - BlogPosting (blog articles)
- [ ] Verify: paste any page URL into [OpenGraph debugger](https://www.opengraph.xyz/) — all fields render

### Analytics

- [ ] Integrate privacy-friendly analytics — Plausible, Umami, or Vercel Analytics (no cookie banner needed)
- [ ] Track: page views, referrers, top pages, device breakdown
- [ ] Verify: analytics dashboard shows data after a test visit

### Done when

- Every page has correct meta/OG tags. Sitemap and robots.txt are present. Analytics records visits.

---

## M8 — Launch

### Pre-launch checklist

- [ ] **Content review:** all placeholder text replaced with real copy
- [ ] **Link audit:** no broken internal or external links (run `lychee` or similar)
- [ ] **Image optimization:** all images use modern formats (WebP/AVIF via Astro's `<Image>`)
- [ ] **Performance:** Lighthouse ≥ 90 on all categories for every page
- [ ] **Accessibility:** axe-core audit — zero critical/serious issues
- [ ] **Cross-browser:** test Chrome, Firefox, Safari (macOS/iOS)
- [ ] **Responsive:** spot-check at 375px, 768px, 1280px, 1920px
- [ ] **Favicon & app icons:** favicon.ico, apple-touch-icon, web manifest
- [ ] **404 page:** custom styled 404

### Deploy

- [ ] Configure production domain: `topnotch.cl` → hosting platform
- [ ] Set up SSL (automatic on Vercel/CF)
- [ ] DNS: A/CNAME records pointing to hosting
- [ ] Verify site loads at `https://topnotch.cl`
- [ ] Submit sitemap to Google Search Console
- [ ] Set up uptime monitoring (UptimeRobot, Better Stack, or similar)

### Done when

- `https://topnotch.cl` is live, SSL is active, Lighthouse ≥ 90, analytics is recording, and uptime monitoring is active.

---

## Tracker

| Milestone | Status | Blocking |
|-----------|--------|----------|
| M1 — Project Setup | Done | — |
| M2 — Branding & Design System | Done | M1 |
| M3 — Landing Page | Planned | M2 |
| M4 — Services & Portfolio | Planned | M2 |
| M5 — Contact & Lead Capture | Planned | M3 |
| M6 — Blog & Content | Planned | M2 |
| M7 — SEO & Analytics | Planned | M3 |
| M8 — Launch | Planned | M3–M7 |

> M4, M6, and M7 can run in parallel after M2 is done. M5 can start after M3.

---

_Last updated: 2026-03-15 02:08_
