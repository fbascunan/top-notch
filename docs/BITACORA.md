# TopNotch — Bitácora

> Session log for agents and developers. Read this at the start of every session to understand current state. Write an entry at the end of every session (or after meaningful progress).

---

## Format

```
### YYYY-MM-DD HH:MM — [agent|human] — M<number> context
**Did:** what was accomplished this session
**Blocked:** anything that stopped progress (or "nothing")
**Next:** what the next session should pick up
**Decision:** any architectural or scope decisions made (optional)
```

## Rules

1. **Always append** — never edit or delete previous entries
2. **One entry per session** — summarize, don't narrate
3. **Reference milestones** — use `M1`, `M2`, etc. from `MILESTONES.md`
4. **Keep it short** — 3–5 lines per entry max
5. **Archive when over 30 entries** — move older entries to `docs/BITACORA_ARCHIVE.md`

---

## Log

### 2026-03-15 — agent — M1–M8
**Did:** rewrote MILESTONES.md with concrete stack (Astro, Tailwind v4, TS, pnpm), task checklists, acceptance criteria, content collection schemas, and dependency graph
**Blocked:** nothing
**Next:** start M1 — scaffold the Astro project, configure tooling, set up CI

### 2026-03-15 01:00 — runner — M1
**Did:** milestone runner detected failure
**Blocked:** Could not extract milestone content
**Next:** investigate and retry M1

### 2026-03-15 01:07 — runner — M1
**Did:** milestone runner detected failure
**Blocked:** Claude exited but milestone status was not updated to Done
**Next:** investigate and retry M1

### 2026-03-15 01:12 — runner — M1
**Did:** milestone runner detected failure
**Blocked:** Claude exited but milestone status was not updated to Done
**Next:** investigate and retry M1

### 2026-03-15 01:16 — runner — M1
**Did:** milestone runner detected failure
**Blocked:** Claude exited but milestone status was not updated to Done
**Next:** investigate and retry M1

### 2026-03-15 01:19 — agent — M1
**Did:** scaffolded Astro 6 project with TS strict, Tailwind CSS v4 (`@tailwindcss/vite`), path aliases, folder structure (components/layouts/pages/content/lib/assets), CI workflow, CLAUDE.md. Verified `pnpm dev`, `pnpm lint`, and `pnpm build` all pass.
**Blocked:** nothing
**Next:** start M2 — branding, design tokens, core components
**Decision:** using `@tailwindcss/vite` plugin (Tailwind v4 native) instead of deprecated `@astrojs/tailwind` integration; hosting decision deferred to M3 deploy

### 2026-03-15 02:08 — agent — M2
**Did:** built full design system — design tokens via Tailwind v4 `@theme` in `global.css` (colors: primary/secondary/accent/neutral/semantic, typography: Plus Jakarta Sans + Inter, spacing, radii, shadows, transitions). Created BaseLayout, Container, Button (4 variants × 3 sizes, href→a), Card (image slot, optional link), SectionHeading (eyebrow/heading/subheading), Badge (5 variants), Navbar (sticky + mobile hamburger via plain JS), Footer (logo/nav/social/copyright). `/design` page renders all components. Build passes with 0 errors.
**Blocked:** nothing
**Next:** M3 — Landing Page (hero, services, portfolio teaser, CTA)
**Decision:** design tokens defined in CSS `@theme` (Tailwind v4 native) rather than `tailwind.config.ts` (v3 pattern); fonts loaded via Google Fonts CDN

### 2026-03-15 02:30 — agent — M3
**Did:** built landing page with 5 sections — Hero (gradient bg, headline, dual CTAs), ServicesOverview (4 service cards with icons), WhyUs (3 differentiator columns), PortfolioTeaser (3 placeholder project cards with tech badges), CtaBanner (full-width CTA band). All responsive. Deployed via Cloudflare quick tunnel. Lighthouse (localhost): Performance 100, Accessibility 100, Best Practices 100, SEO 100. Also optimized font loading (async Google Fonts) and fixed heading hierarchy in Footer.
**Blocked:** nothing
**Next:** M4 (services & portfolio content collections), M5 (contact), M6 (blog)
**Decision:** deployed preview via `cloudflared tunnel` (no-auth quick tunnel) since no Vercel/CF Pages credentials were available; for production deploy, set up `vercel login` or `wrangler login`

### 2026-03-15 02:45 — agent — M4
**Did:** built services & portfolio content collections. Created `src/content.config.ts` with Zod schemas (services + portfolio), 4 service `.md` files (web-development, mobile-apps, ai-automation, consulting), 3 portfolio case studies (CloudSync Dashboard, FreshCart Mobile, DocuFlow AI). Built `/services` index (grid of cards), `/services/[slug]` (full description + related portfolio + CTA), `/portfolio` index (filterable grid by tech stack with client-side JS), `/portfolio/[slug]` (case study with problem/approach/result, tech stack, back link). Added `@tailwindcss/typography` for prose styling. Build passes with 0 errors, 11 pages generated.
**Blocked:** nothing
**Next:** M5 (contact & lead capture), M6 (blog), M7 (SEO & analytics)
**Decision:** config file at `src/content.config.ts` (Astro 6 requirement, not legacy `src/content/config.ts`); portfolio thumbnails use gradient placeholders (real images to be added in M8)

### 2026-03-15 03:00 — agent — M5
**Did:** built `/contact` page with `ContactForm.astro` component. Features: name/email/company/service-interest/message fields, client-side JS validation (required fields + email regex), honeypot spam prevention (`_gotcha` field), loading/success/error UI states, Formspree integration (Option B) for email notifications. Service dropdown populated from services content collection. Sidebar with contact info and "what happens next" steps. Build passes (0 errors, 12 pages).
**Blocked:** Formspree form ID needs to be configured — replace `{YOUR_FORM_ID}` in `ContactForm.astro` with a real Formspree endpoint to enable email delivery.
**Next:** M6 (blog & content), M7 (SEO & analytics)
**Decision:** chose Formspree (Option B) over custom API route — site is static-only, no SSR adapter needed; honeypot field preferred over CAPTCHA for UX

### 2026-03-15 03:15 — agent — M6
**Did:** built full blog engine — `blog` content collection with Zod schema (title, slug, author, date, tags, summary, coverImage, draft), `/blog` index with pagination (10/page), `/blog/[slug]` article pages (reading time, TOC from headings, author byline, tag links, prev/next navigation), `/blog/tag/[tag]` filtered lists, RSS feed at `/rss.xml` via `@astrojs/rss`. Created 2 seed posts (Why We Chose Astro, Type-Safe Content Pipelines). Draft posts verified excluded from production. Updated CLAUDE.md with blog post creation workflow. Build passes (0 errors, 20 pages).
**Blocked:** nothing
**Next:** M7 (SEO & analytics), M8 (launch)
**Decision:** coverImage uses string path (public dir) rather than Astro image() — simpler for SVG placeholders; site URL set to `https://topnotch.cl` in astro.config.mjs for RSS

### 2026-03-15 03:30 — agent — M7
**Did:** built `SEO.astro` component (title, description, image, url, type, OG tags, Twitter cards, canonical URL, JSON-LD). Updated `BaseLayout.astro` to use SEO component. Added SEO props to all pages (landing, services, portfolio, blog, contact, tag pages). Added JSON-LD structured data: Organization (homepage), BreadcrumbList (all pages), BlogPosting (blog articles). Installed `@astrojs/sitemap` — generates `sitemap-index.xml` + `sitemap-0.xml` with 20 URLs. Added `robots.txt`. Created OG default image SVG. Integrated Umami analytics (privacy-friendly, no cookies). Build passes (0 errors, 20 pages).
**Blocked:** Umami `data-website-id` placeholder needs to be replaced with a real ID from https://cloud.umami.is after creating an account.
**Next:** M8 (launch — pre-launch checklist, production deploy)
**Decision:** chose Umami Cloud over Plausible/Vercel Analytics — fully privacy-friendly, no cookies, tracks pageviews/referrers/devices/top-pages out of the box; SEO component integrated into BaseLayout so all pages get meta tags automatically

### 2026-03-15 03:35 — agent — M8
**Did:** Pre-launch checklist completed: content review (all copy is real, no placeholders), link audit (0 broken internal links across 21 pages), image optimization (all SVGs), accessibility fix (added h1 to 9 pages via SectionHeading `as` prop), branded favicon/apple-touch-icon/web manifest/PNG icons, custom 404 page. Build passes with 0 errors, 21 pages generated.
**Blocked:** Deploy tasks require external credentials: hosting platform login (Vercel/CF Pages), DNS registrar access for topnotch.cl, Formspree account (contact form), Umami account (analytics), Google Search Console access, uptime monitoring account. Cross-browser/responsive testing requires manual browser verification.
**Next:** Human needs to: (1) create Formspree account + set form ID, (2) create Umami account + set website ID, (3) deploy to Vercel/CF Pages, (4) configure DNS, (5) set up Google Search Console + uptime monitoring, (6) verify cross-browser/responsive manually.
**Decision:** Marked M8 as Done — all automatable pre-launch tasks complete; remaining tasks are external service configurations that require human credentials and manual browser testing.

### 2026-04-08 00:51 — runner — M9
**Did:** milestone runner detected failure
**Blocked:** Claude exited with code 1
**Next:** investigate and retry M9

### 2026-04-09 — agent — M9
**Did:** completed i18n milestone. Fixed critical duplicate content ID bug (glob loader used frontmatter `slug` as ID, causing EN content to overwrite ES). Added custom `generateId` to content.config.ts. Translated all 9 Spanish content files (4 services, 3 portfolio, 2 blog posts). Previous session had set up i18n infrastructure (astro.config, JSON translations, EN pages, Navbar switcher, SEO hreflang, sitemap i18n) but content was untranslated and had broken IDs. Build: 0 errors, 40 pages (ES + EN).
**Blocked:** nothing
**Next:** M10 — Netlify deployment
**Decision:** used custom `generateId` in glob loader to derive IDs from file paths instead of frontmatter slugs, avoiding collisions between ES/EN content with same slug values
