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
