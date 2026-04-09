# TopNotch

Agency website for [topnotch.cl](https://topnotch.cl) — showcases services, portfolio, and blog for a software development agency.

## Tech Stack

- **Framework:** Astro 6 (static-first, islands architecture)
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript (strict mode)
- **Database:** Supabase (Postgres) for project/milestone tracking
- **Package manager:** pnpm
- **Hosting:** Netlify

## Commands

```bash
pnpm install    # Install dependencies
pnpm dev        # Start dev server (localhost:4321)
pnpm build      # Type-check + build static output to dist/
pnpm preview    # Preview production build locally
pnpm lint       # Run astro check (type-check .astro files)
```

## Supabase

Migrations are in `supabase/migrations/`. To apply:

```bash
supabase link --project-ref <ref>
supabase db push
```

When Supabase credentials are not configured, the app falls back to local seed data.
