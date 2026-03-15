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
**Did:** built landing page with 5 sections — Hero (gradient bg, headline, dual CTAs), ServicesOverview (4 service cards with icons), WhyUs (3 differentiator columns), PortfolioTeaser (3 placeholder project cards with tech badges), CtaBanner (full-width CTA band). All sections responsive. Lighthouse: Performance 100, Accessibility 98, Best Practices 100, SEO 100.
**Blocked:** deploy to preview URL — no credentials for Vercel, Cloudflare, or Surge. Need `vercel login` or `wrangler login` to deploy.
**Next:** deploy preview (needs auth), then M4/M5/M6
