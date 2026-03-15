# TopNotch — CLAUDE.md

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
