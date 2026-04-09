# TopNotch — CLAUDE.md

## First Action

Read the following files in `docs/` for full project context:
- `docs/PROSPECT.md` — **read first** — defines the buyer and their needs; every decision must serve this
- `docs/MILESTONES.md` — milestone tracker
- `docs/BITACORA.md` — session log (read last entries, write new entry when done)

## Stack

- **Framework:** Astro 6 (static-first, islands architecture)
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Language:** TypeScript (strict mode)
- **Package manager:** pnpm

## Commands

```bash
pnpm dev        # Start dev server (localhost:4321)
pnpm build      # Type-check + build static output to dist/
pnpm preview    # Preview production build locally
pnpm lint       # Run astro check (type-check .astro files)
```

## Project Structure

```
src/
├── components/    # Reusable UI components
├── layouts/       # Page layouts
├── pages/         # File-based routing
├── content/       # Astro content collections (blog, portfolio)
├── lib/           # Utilities, constants, types
├── assets/        # Images, fonts
└── styles/        # Global CSS (Tailwind entry point)
```

## Path Aliases

- `@/components/*` → `src/components/*`
- `@/layouts/*` → `src/layouts/*`
- `@/lib/*` → `src/lib/*`

## Conventions

- Use `.astro` for components unless client-side interactivity is needed
- Keep pages thin — compose from layout + components
- Content collections use Markdown with typed frontmatter schemas

## Creating a New Blog Post

1. Create a new `.md` file in `src/content/blog/` (e.g., `my-new-post.md`)
2. Add the required frontmatter:

```yaml
---
title: "Your Post Title"
slug: "your-post-slug"
author: "Author Name"
date: 2026-03-15
tags: ["tag1", "tag2"]
summary: "A short summary for cards and meta description."
coverImage: "/blog/your-cover-image.svg"
draft: false
---
```

3. Add a cover image to `public/blog/` (SVG, PNG, or JPG — 1200×630 recommended)
4. Set `draft: true` to exclude from production builds while writing
5. Run `pnpm build` to verify — the schema validates all frontmatter fields at build time

The post will automatically appear on `/blog`, in tag pages at `/blog/tag/[tag]`, and in the RSS feed at `/rss.xml`.
