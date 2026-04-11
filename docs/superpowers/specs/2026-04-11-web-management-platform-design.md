# TopNotch Web Management Platform — Design Spec

> Turn the top-notch showcase site into an interactive platform where authenticated users can manage projects, milestones, and markdown documentation from the browser — using the same UI as public visitors, with inline CRUD controls.

---

## Context

TopNotch is currently a static Astro site deployed on Netlify. It reads project/milestone data from Supabase at build time and displays a read-only project showcase. The local workspace has `run-milestone.sh` for autonomous milestone execution and `milestones-sync.ts` for bidirectional MD↔DB sync.

The goal is to create a webapp that enables high-quality AI-driven project generation. The key differentiator is the documentation layer (PROSPECT.md, lineaments, knowledge base) that guides AI agents to produce better results than generic vibe-coded projects. The CRUD is scaffolding; the docs are the product.

---

## Approach

**Astro hybrid + API routes + lightweight fetch (no framework islands).**

- Astro hybrid mode: static by default, opt-in SSR for auth-conditional pages
- CRUD via Astro API routes (`/api/*`) called with `fetch()` from inline scripts
- DOM updates without full page reloads via simple DOM swaps
- No React/Solid dependency — keeps the stack lean
- API-first: same endpoints usable by AI agents and future automation

---

## Data Model

### Existing Schema Note

The existing tables (`projects`, `milestones`, `milestone_tasks`, `run_history`) use `BIGINT GENERATED ALWAYS AS IDENTITY` for primary keys. New tables use UUID. Foreign keys referencing existing tables must use `BIGINT` to match.

The existing `projects` table has a `folder` column (e.g., `'top-notch'`) but no `slug` column. The current data layer derives slugs from `folder` via `folderToSlug()`. For web-created projects, `folder` is auto-derived from `name` (lowercased, spaces to hyphens).

### New Tables

```sql
organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
)
-- Attach update_updated_at() trigger

org_members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade,
  user_id     uuid not null,  -- from supabase auth.users
  role        text not null check (role in ('owner', 'member')),
  created_at  timestamptz default now(),
  unique(org_id, user_id)
)

documents (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  title       text not null,
  content     text not null default '',  -- markdown, max ~1MB enforced at API layer
  scope       text not null check (scope in ('global', 'project')),
  project_id  bigint references projects(id) on delete cascade,  -- null for global (BIGINT to match existing PK)
  org_id      uuid references organizations(id) on delete cascade,
  doc_type    text not null check (doc_type in ('prospect', 'lineament', 'bitacora', 'spec', 'custom')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique nulls not distinct (org_id, project_id, slug)
)
-- Attach update_updated_at() trigger
```

### Modified Tables

```sql
-- Add org_id to existing projects table, backfill, then enforce NOT NULL:
ALTER TABLE projects ADD COLUMN org_id uuid references organizations(id);
UPDATE projects SET org_id = '<topnotch-org-uuid>';
ALTER TABLE projects ALTER COLUMN org_id SET NOT NULL;
```

### Seed Data

- Create a default "TopNotch" organization
- Assign `org_id` to all existing projects (via UPDATE + NOT NULL enforcement)
- Seed existing lineaments (SUPABASE.md, DEPLOYMENT.md) as global documents
- Seed existing PROSPECT.md files as project-scoped documents

### RLS Policies

All existing RLS policies on `projects`, `milestones`, `milestone_tasks`, and `run_history` must be **dropped and replaced** with org-scoped versions.

**Anonymous (anon role):**
- SELECT on `projects`, `milestones`, `milestone_tasks`: allowed (public showcase)
- SELECT on `documents`: allowed where `scope = 'global'` OR the parent project is public

**Authenticated org members:**
- Full CRUD on `projects` where `org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())`
- Full CRUD on `milestones` where `project_id IN (SELECT id FROM projects WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))`
- Full CRUD on `milestone_tasks` via same join through `milestones` → `projects`
- Full CRUD on `documents` where `org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())`
- Full CRUD on `organizations` and `org_members` where user is a member

**Global lineaments:** readable by all authenticated users, writable only by members of the owning org

### Supabase Client Model

Two client patterns in the server-side data layer:

1. **User client** — initialized with the user's JWT from the auth cookie. Used by API routes for org-scoped operations. Respects RLS policies, so a user can only access their org's data.
2. **Service role client** — initialized with `SUPABASE_SERVICE_ROLE_KEY` env var. Used by automation/AI agents that need cross-org access. Never exposed client-side. Optional — only needed when automation features are added.

---

## Auth Flow

### Implementation

- **Provider:** Supabase Auth with Google OAuth
- **Login:** "Sign in" button in Navbar → Supabase Google OAuth redirect
- **Callback:** `GET /api/auth/callback` receives OAuth redirect with code param, exchanges for session, sets HTTP-only cookie
- **Middleware:** `src/middleware.ts` reads cookie on every SSR request, resolves user + org membership, injects `{user, org, isAdmin}` into `Astro.locals`
- **Logout:** `/api/auth/logout` clears cookie, redirects to home
- **First login:** New users don't belong to any org. Members are added manually via Supabase dashboard for now (invite flow deferred)

### UI States

| State | Behavior |
|-------|----------|
| Anonymous | Read-only showcase (current behavior) |
| Logged in, no org | Same as anonymous + avatar in navbar |
| Logged in, org member | Edit/delete buttons, add buttons, markdown editor, CRUD actions |

---

## API Routes

All under `src/pages/api/`. JSON in, JSON out. Auth checked via middleware — 401 if no session, 403 if not an org member.

```
GET    /api/auth/callback              — handle OAuth redirect, set cookie
POST   /api/auth/logout                — clear cookie

GET    /api/projects                    — list org projects
POST   /api/projects                    — create project
PATCH  /api/projects/[id]              — update project
DELETE /api/projects/[id]              — delete project

GET    /api/projects/[id]/milestones   — list milestones
POST   /api/projects/[id]/milestones   — create milestone
PATCH  /api/milestones/[id]            — update milestone
DELETE /api/milestones/[id]            — delete milestone

POST   /api/milestones/[id]/tasks      — add task
PATCH  /api/tasks/[id]                 — update task (toggle done, edit)
DELETE /api/tasks/[id]                 — delete task

GET    /api/documents                  — list docs (filterable by scope, project_id, doc_type)
POST   /api/documents                  — create document
GET    /api/documents/[id]             — get document content
PATCH  /api/documents/[id]            — update document
DELETE /api/documents/[id]            — delete document
```

**Design decisions:**
- No pagination — project/milestone counts are small enough
- API routes return the updated object after mutation (client updates DOM without refetch)
- Same endpoints callable by AI agents with service role key or authenticated token

---

## Page Changes & UI Behavior

### Modified Pages

**`/projects` (index)**
- Anonymous: current read-only grid
- Authenticated: same grid + "New Project" card at the end (dashed-border wireframe with `+` icon). Each project card gets a pencil edit icon in the corner
- "New Project" opens inline form (replaces the card) — name, domain, status, priority, notes. `folder` auto-derived from name (lowercased, spaces to hyphens). Submit via fetch, new card appears without reload
- Edit icon expands card into editable form with save/cancel

**`/projects/[slug]` (detail)**
- Anonymous: current read-only view (header, progress bar, milestone timeline)
- Authenticated:
  - Project header fields editable on click (inline edit pattern)
  - Each milestone gets edit/delete icons
  - "Add Milestone" button at bottom of timeline → inline form
  - Task checkboxes toggle via fetch, add task input at bottom of each milestone
  - **New "Documents" section** below milestone timeline — project-scoped doc cards (title, doc_type badge, last updated). Click to open editor. "Add Document" button at end

### New Pages

**`/docs` (global documents)**
- Lists all global-scope documents (lineaments, shared knowledge)
- Anonymous: read-only rendered markdown
- Authenticated: add/edit/delete pattern matching project docs

**`/docs/[slug]` (document view/edit)**
- Anonymous: rendered markdown, clean reading view
- Authenticated: "Edit" button → split-pane editor (textarea left, rendered preview right). Save/cancel. Title and doc_type editable at top

### i18n

The new/modified pages follow the existing i18n pattern: Spanish at the root path, English duplicated under `/en/`. API routes (`/api/*`) are language-agnostic. The markdown editor UI labels use the same i18n JSON translation files as the rest of the site.

### Navbar Changes

- Add "Docs" link (next to Projects)
- Add Sign In / avatar+Sign Out button on the right

---

## Markdown Editor

Minimal, no library dependency beyond `marked`. Reusable inline component.

- Toggles between "view mode" (rendered HTML) and "edit mode" (editor)
- **Edit mode:** textarea left, live preview right (side by side desktop, tabbed mobile)
- **Toolbar:** bold, italic, heading (H2/H3), link, code block, bullet list — inserts markdown at cursor
- **Preview:** client-side rendering via `marked` (~7kb gzipped)
- **Save:** explicit button, sends `PATCH /api/documents/[id]` via fetch, swaps to view mode
- **Cancel:** discards changes, swaps to view mode
- **No autosave**

**Server-side markdown rendering:** View mode renders markdown to HTML on the server (Astro SSR), so anonymous users get static HTML with zero JS. Editor JS only loads when authenticated user clicks "Edit."

---

## Stack Delta

| Addition | Purpose |
|----------|---------|
| `@astrojs/netlify` | Hybrid mode adapter for SSR on Netlify |
| `marked` | Client-side markdown → HTML (~7kb) |
| New Supabase migration | organizations, org_members, documents tables + org_id on projects |
| `src/middleware.ts` | Auth session resolution |

---

## Deferred (Future Milestones)

- Automation trigger from web (run milestones remotely)
- Multi-tenant org management UI (orgs exist in schema, managed via DB for now)
- Invite flow / user management
- Real-time collaboration
- RBAC beyond "member or not"

---

_Spec date: 2026-04-11_
