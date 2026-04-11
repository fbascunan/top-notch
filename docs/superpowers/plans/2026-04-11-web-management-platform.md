# Web Management Platform — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the static top-notch showcase into an interactive platform where authenticated org members can manage projects, milestones, and markdown documentation inline — same UI for everyone, CRUD controls visible only to members.

**Architecture:** Astro hybrid mode (static by default, SSR for auth-conditional pages). Supabase Auth with Google OAuth + cookie sessions. API routes for CRUD. Inline `fetch()` scripts for DOM updates without page reloads. Markdown documents stored in Supabase, rendered server-side for anonymous, editable client-side with `marked` for authenticated users.

**Tech Stack:** Astro 6 (hybrid), Tailwind CSS v4, Supabase (Auth + DB + RLS), `@astrojs/netlify` adapter, `marked` for markdown preview.

**Spec:** `docs/superpowers/specs/2026-04-11-web-management-platform-design.md`

---

## File Structure

### New files

```
supabase/migrations/
  00004_organizations_and_documents.sql  — organizations, org_members, documents tables + org_id on projects

src/lib/
  supabase-server.ts    — server-side Supabase client (user JWT + service role patterns)
  documents-data.ts     — data fetching for documents (Supabase + seed fallback)
  auth.ts               — helper functions for session management

src/middleware.ts        — resolve auth session, inject user/org into Astro.locals

src/pages/api/auth/
  callback.ts           — GET handler for OAuth redirect
  logout.ts             — POST handler for logout

src/pages/api/
  projects/
    index.ts            — GET (list) + POST (create)
    [id].ts             — PATCH + DELETE
    [id]/milestones.ts  — GET + POST
  milestones/
    [id].ts             — PATCH + DELETE
    [id]/tasks.ts       — POST
  tasks/
    [id].ts             — PATCH + DELETE
  documents/
    index.ts            — GET (list) + POST (create)
    [id].ts             — GET + PATCH + DELETE

src/components/
  AuthButton.astro      — sign in / avatar+sign out button
  InlineEditor.astro    — markdown split-pane editor component
  ProjectForm.astro     — inline project create/edit form
  MilestoneForm.astro   — inline milestone create/edit form
  DocumentCard.astro    — card for doc listing (title, type badge, date)

src/pages/
  docs/
    index.astro         — global documents listing
    [slug].astro        — document view/edit page
  en/docs/
    index.astro         — EN version
    [slug].astro        — EN version
```

### Modified files

```
astro.config.mjs                    — add @astrojs/netlify adapter, output: 'hybrid'
src/lib/supabase.ts                 — keep for anonymous/build-time; add exports for env detection
src/lib/projects-data.ts            — add org_id filtering, add mutation functions
src/components/Navbar.astro         — add "Docs" link, add AuthButton
src/pages/projects/index.astro      — add SSR prerender=false, add inline CRUD controls
src/pages/projects/[slug].astro     — add SSR prerender=false, add inline editing + documents section
src/pages/en/projects/index.astro   — mirror SSR changes
src/pages/en/projects/[slug].astro  — mirror SSR changes
src/i18n/es.json                    — add translation keys for auth, docs, editor, forms
src/i18n/en.json                    — add translation keys for auth, docs, editor, forms
src/env.d.ts                        — declare Astro.locals types (user, org, isMember)
package.json                        — add @astrojs/netlify, marked
```

---

## Chunk 1: Database Migration + Supabase Server Client

### Task 1: Write the database migration

**Files:**
- Create: `supabase/migrations/00004_organizations_and_documents.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- 00004_organizations_and_documents.sql
-- Adds multi-org support and markdown document storage

-- Organizations table
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Org membership table
CREATE TABLE org_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Add org_id to projects
ALTER TABLE projects ADD COLUMN org_id UUID REFERENCES organizations(id);

-- Documents table
CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  scope       TEXT NOT NULL CHECK (scope IN ('global', 'project')),
  project_id  BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  doc_type    TEXT NOT NULL CHECK (doc_type IN ('prospect', 'lineament', 'bitacora', 'spec', 'custom')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (org_id, project_id, slug)
);

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_documents_org ON documents(org_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_scope ON documents(scope);
CREATE INDEX idx_org_members_user ON org_members(user_id);

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Seed default TopNotch organization
INSERT INTO organizations (id, name, slug)
VALUES ('a0000000-0000-0000-0000-000000000001', 'TopNotch', 'topnotch');

-- Backfill org_id on existing projects
UPDATE projects SET org_id = 'a0000000-0000-0000-0000-000000000001';
ALTER TABLE projects ALTER COLUMN org_id SET NOT NULL;

-- Drop old RLS policies (from 00002)
DROP POLICY IF EXISTS "anon_read_projects" ON projects;
DROP POLICY IF EXISTS "anon_read_milestones" ON milestones;
DROP POLICY IF EXISTS "anon_read_milestone_tasks" ON milestone_tasks;
DROP POLICY IF EXISTS "anon_read_run_history" ON run_history;
DROP POLICY IF EXISTS "authenticated_all_projects" ON projects;
DROP POLICY IF EXISTS "authenticated_all_milestones" ON milestones;
DROP POLICY IF EXISTS "authenticated_all_milestone_tasks" ON milestone_tasks;
DROP POLICY IF EXISTS "authenticated_all_run_history" ON run_history;

-- New org-scoped RLS policies

-- Organizations: anyone can read, members can update their own org
CREATE POLICY "anon_read_organizations" ON organizations
  FOR SELECT TO anon USING (true);
CREATE POLICY "authenticated_read_organizations" ON organizations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "members_manage_organizations" ON organizations
  FOR ALL TO authenticated
  USING (id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Org members: members can read their own org membership
CREATE POLICY "members_read_own_org" ON org_members
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Projects: anon read, org members CRUD
CREATE POLICY "anon_read_projects" ON projects
  FOR SELECT TO anon USING (true);
CREATE POLICY "authenticated_read_projects" ON projects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "members_manage_projects" ON projects
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Milestones: anon read, org members CRUD (join through projects)
CREATE POLICY "anon_read_milestones" ON milestones
  FOR SELECT TO anon USING (true);
CREATE POLICY "authenticated_read_milestones" ON milestones
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "members_manage_milestones" ON milestones
  FOR ALL TO authenticated
  USING (project_id IN (
    SELECT id FROM projects WHERE org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  ))
  WITH CHECK (project_id IN (
    SELECT id FROM projects WHERE org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  ));

-- Milestone tasks: anon read, org members CRUD (join through milestones → projects)
CREATE POLICY "anon_read_milestone_tasks" ON milestone_tasks
  FOR SELECT TO anon USING (true);
CREATE POLICY "authenticated_read_milestone_tasks" ON milestone_tasks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "members_manage_milestone_tasks" ON milestone_tasks
  FOR ALL TO authenticated
  USING (milestone_id IN (
    SELECT m.id FROM milestones m
    JOIN projects p ON m.project_id = p.id
    WHERE p.org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ))
  WITH CHECK (milestone_id IN (
    SELECT m.id FROM milestones m
    JOIN projects p ON m.project_id = p.id
    WHERE p.org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- Run history: anon read, org members CRUD
CREATE POLICY "anon_read_run_history" ON run_history
  FOR SELECT TO anon USING (true);
CREATE POLICY "authenticated_read_run_history" ON run_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "members_manage_run_history" ON run_history
  FOR ALL TO authenticated
  USING (milestone_id IN (
    SELECT m.id FROM milestones m
    JOIN projects p ON m.project_id = p.id
    WHERE p.org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ))
  WITH CHECK (milestone_id IN (
    SELECT m.id FROM milestones m
    JOIN projects p ON m.project_id = p.id
    WHERE p.org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- Documents: anon read global, org members CRUD own org docs
CREATE POLICY "anon_read_global_documents" ON documents
  FOR SELECT TO anon USING (scope = 'global');
CREATE POLICY "anon_read_project_documents" ON documents
  FOR SELECT TO anon USING (scope = 'project');
CREATE POLICY "authenticated_read_documents" ON documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "members_manage_documents" ON documents
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
```

- [ ] **Step 2: Verify migration applies cleanly locally**

Run: `cd /home/feland/SideProjects/top-notch-projects/top-notch && supabase db reset`
Expected: All migrations apply without errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/00004_organizations_and_documents.sql
git commit -m "feat: add organizations, documents tables and org-scoped RLS"
```

---

### Task 2: Install dependencies and configure Astro hybrid mode

**Files:**
- Modify: `package.json`
- Modify: `astro.config.mjs`

- [ ] **Step 1: Install new dependencies**

Run: `cd /home/feland/SideProjects/top-notch-projects/top-notch && pnpm add @astrojs/netlify marked`

Note: `marked` ships its own types since v4, no `@types/marked` needed.

- [ ] **Step 2: Update astro.config.mjs to hybrid mode with Netlify adapter**

```javascript
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://topnotch.cl',
  output: 'hybrid',
  adapter: netlify(),
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'es',
        locales: {
          es: 'es',
          en: 'en',
        },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
```

Note: `output: 'hybrid'` means static by default. Pages that need SSR opt in with `export const prerender = false;`. The Netlify adapter handles SSR for those pages.

- [ ] **Step 3: Verify build still works**

Run: `pnpm build`
Expected: Build succeeds with 0 errors. All existing static pages still generated.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml astro.config.mjs
git commit -m "feat: add Netlify adapter and marked for hybrid SSR"
```

---

### Task 3: Create server-side Supabase client and auth helpers

**Files:**
- Create: `src/lib/supabase-server.ts`
- Create: `src/lib/auth.ts`
- Modify: `src/env.d.ts`

- [ ] **Step 1: Create `src/env.d.ts` with Astro.locals types**

Check if `src/env.d.ts` exists first and extend it. Add:

```typescript
/// <reference types="astro/client" />

interface OrgMembership {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: string;
}

interface AuthLocals {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
  } | null;
  org: OrgMembership | null;
  isMember: boolean;
}

declare namespace App {
  interface Locals extends AuthLocals {}
}
```

- [ ] **Step 2: Create `src/lib/supabase-server.ts`**

```typescript
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY ?? "";
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * Create a Supabase client authenticated with a user's JWT.
 * Used by API routes to respect RLS for the logged-in user.
 */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

/**
 * Create a Supabase client with the service role key.
 * Bypasses RLS. Used for admin operations and automation.
 * Returns null if service role key is not configured.
 */
export function createServiceClient(): SupabaseClient | null {
  if (!supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Create an anonymous Supabase client (same as existing supabase.ts).
 * Used for public read operations.
 */
export function createAnonClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}
```

- [ ] **Step 3: Create `src/lib/auth.ts`**

```typescript
import type { AstroCookies } from "astro";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY ?? "";

const COOKIE_ACCESS = "sb-access-token";
const COOKIE_REFRESH = "sb-refresh-token";

/**
 * Exchange an OAuth code for a session and set cookies.
 */
export async function handleAuthCallback(
  code: string,
  cookies: AstroCookies
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return { success: false, error: error?.message ?? "No session returned" };
  }

  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };

  cookies.set(COOKIE_ACCESS, data.session.access_token, cookieOptions);
  cookies.set(COOKIE_REFRESH, data.session.refresh_token, cookieOptions);

  return { success: true };
}

/**
 * Read session from cookies and return user info.
 * Refreshes the session if the access token is expired.
 */
export async function getSessionFromCookies(
  cookies: AstroCookies
): Promise<{
  user: App.Locals["user"];
  accessToken: string | null;
}> {
  const accessToken = cookies.get(COOKIE_ACCESS)?.value;
  const refreshToken = cookies.get(COOKIE_REFRESH)?.value;

  if (!accessToken) {
    return { user: null, accessToken: null };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (!error && data.user) {
    return {
      user: {
        id: data.user.id,
        email: data.user.email ?? "",
        name: data.user.user_metadata?.full_name ?? data.user.email ?? "",
        avatarUrl: data.user.user_metadata?.avatar_url ?? "",
      },
      accessToken,
    };
  }

  // Try refreshing the session
  if (refreshToken) {
    const { data: refreshData, error: refreshError } =
      await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (!refreshError && refreshData.session) {
      const cookieOptions = {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax" as const,
        maxAge: 60 * 60 * 24 * 7,
      };
      cookies.set(COOKIE_ACCESS, refreshData.session.access_token, cookieOptions);
      cookies.set(COOKIE_REFRESH, refreshData.session.refresh_token, cookieOptions);

      const user = refreshData.session.user;
      return {
        user: {
          id: user.id,
          email: user.email ?? "",
          name: user.user_metadata?.full_name ?? user.email ?? "",
          avatarUrl: user.user_metadata?.avatar_url ?? "",
        },
        accessToken: refreshData.session.access_token,
      };
    }
  }

  // Clear invalid cookies
  cookies.delete(COOKIE_ACCESS, { path: "/" });
  cookies.delete(COOKIE_REFRESH, { path: "/" });
  return { user: null, accessToken: null };
}

/**
 * Clear auth cookies.
 */
export function clearSession(cookies: AstroCookies): void {
  cookies.delete(COOKIE_ACCESS, { path: "/" });
  cookies.delete(COOKIE_REFRESH, { path: "/" });
}
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: Build succeeds (new files are not imported by any page yet, so no runtime effect).

- [ ] **Step 5: Commit**

```bash
git add src/env.d.ts src/lib/supabase-server.ts src/lib/auth.ts
git commit -m "feat: add server-side Supabase client and auth helpers"
```

---

### Task 4: Create middleware for auth resolution

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Write the middleware**

```typescript
import { defineMiddleware } from "astro:middleware";
import { getSessionFromCookies } from "./lib/auth";
import { createUserClient } from "./lib/supabase-server";

export const onRequest = defineMiddleware(async (context, next) => {
  // Default: no auth
  context.locals.user = null;
  context.locals.org = null;
  context.locals.isMember = false;

  // Skip auth resolution for static assets and build-time rendering
  const url = context.url;
  if (url.pathname.startsWith("/_") || url.pathname.match(/\.\w+$/)) {
    return next();
  }

  const { user, accessToken } = await getSessionFromCookies(context.cookies);

  if (!user || !accessToken) {
    return next();
  }

  context.locals.user = user;

  // Resolve org membership
  try {
    const supabase = createUserClient(accessToken);
    const { data: memberships } = await supabase
      .from("org_members")
      .select("org_id, role, organizations(id, name, slug)")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (memberships?.organizations) {
      const org = memberships.organizations as any;
      context.locals.org = {
        orgId: org.id,
        orgName: org.name,
        orgSlug: org.slug,
        role: memberships.role,
      };
      context.locals.isMember = true;
    }
  } catch {
    // No membership — user sees read-only view
  }

  return next();
});
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds. Middleware is registered automatically by Astro.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add auth middleware for session and org resolution"
```

---

## Chunk 2: Auth Routes + AuthButton Component

### Task 5: Create auth API routes

**Files:**
- Create: `src/pages/api/auth/callback.ts`
- Create: `src/pages/api/auth/logout.ts`

- [ ] **Step 1: Create `src/pages/api/auth/callback.ts`**

```typescript
import type { APIRoute } from "astro";
import { handleAuthCallback } from "../../../lib/auth";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get("code");

  if (!code) {
    return redirect("/?error=no_code", 302);
  }

  const { success, error } = await handleAuthCallback(code, cookies);

  if (!success) {
    console.error("Auth callback failed:", error);
    return redirect("/?error=auth_failed", 302);
  }

  // Redirect to the page they were on, or home
  const next = url.searchParams.get("next") ?? "/";
  return redirect(next, 302);
};
```

- [ ] **Step 2: Create `src/pages/api/auth/logout.ts`**

```typescript
import type { APIRoute } from "astro";
import { clearSession } from "../../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  clearSession(cookies);
  return redirect("/", 302);
};
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/auth/
git commit -m "feat: add OAuth callback and logout API routes"
```

---

### Task 6: Create AuthButton component and update Navbar

**Files:**
- Create: `src/components/AuthButton.astro`
- Modify: `src/components/Navbar.astro`
- Modify: `src/i18n/es.json`
- Modify: `src/i18n/en.json`

- [ ] **Step 1: Add auth-related i18n keys to `es.json`**

Add to the JSON (top-level):

```json
"auth": {
  "signIn": "Iniciar sesión",
  "signOut": "Cerrar sesión"
},
"docs": {
  "nav": "Documentos",
  "eyebrow": "Base de conocimiento",
  "heading": "Documentos",
  "subheading": "Lineamientos, specs y documentación compartida.",
  "noDocuments": "No hay documentos todavía.",
  "addDocument": "Nuevo documento",
  "edit": "Editar",
  "save": "Guardar",
  "cancel": "Cancelar",
  "delete": "Eliminar",
  "confirmDelete": "¿Eliminar este documento?",
  "title": "Título",
  "slug": "Slug",
  "type": "Tipo",
  "scope": "Alcance",
  "global": "Global",
  "project": "Proyecto"
},
"editor": {
  "preview": "Vista previa",
  "write": "Escribir",
  "bold": "Negrita",
  "italic": "Cursiva",
  "heading": "Encabezado",
  "link": "Enlace",
  "code": "Código",
  "list": "Lista"
},
"forms": {
  "save": "Guardar",
  "cancel": "Cancelar",
  "delete": "Eliminar",
  "confirmDelete": "¿Estás seguro?",
  "name": "Nombre",
  "domain": "Dominio",
  "status": "Estado",
  "priority": "Prioridad",
  "notes": "Notas",
  "addProject": "Nuevo proyecto",
  "addMilestone": "Nuevo milestone",
  "addTask": "Nueva tarea",
  "milestoneTitle": "Título",
  "milestoneDescription": "Descripción",
  "milestoneStatus": "Estado",
  "milestoneBlocking": "Depende de"
}
```

- [ ] **Step 2: Add same keys to `en.json`**

```json
"auth": {
  "signIn": "Sign in",
  "signOut": "Sign out"
},
"docs": {
  "nav": "Docs",
  "eyebrow": "Knowledge Base",
  "heading": "Documents",
  "subheading": "Lineaments, specs, and shared documentation.",
  "noDocuments": "No documents yet.",
  "addDocument": "New document",
  "edit": "Edit",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "confirmDelete": "Delete this document?",
  "title": "Title",
  "slug": "Slug",
  "type": "Type",
  "scope": "Scope",
  "global": "Global",
  "project": "Project"
},
"editor": {
  "preview": "Preview",
  "write": "Write",
  "bold": "Bold",
  "italic": "Italic",
  "heading": "Heading",
  "link": "Link",
  "code": "Code",
  "list": "List"
},
"forms": {
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "confirmDelete": "Are you sure?",
  "name": "Name",
  "domain": "Domain",
  "status": "Status",
  "priority": "Priority",
  "notes": "Notes",
  "addProject": "New project",
  "addMilestone": "New milestone",
  "addTask": "New task",
  "milestoneTitle": "Title",
  "milestoneDescription": "Description",
  "milestoneStatus": "Status",
  "milestoneBlocking": "Depends on"
}
```

- [ ] **Step 3: Create `src/components/AuthButton.astro`**

```astro
---
import { t, type Locale } from "../i18n/index";

interface Props {
  lang?: Locale;
}

const { lang = "es" } = Astro.props;
const user = Astro.locals.user;

const supabaseUrl = import.meta.env.SUPABASE_URL ?? "";
// Build the Google OAuth URL that redirects to our callback
const loginUrl = user
  ? ""
  : `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(Astro.url.origin + "/api/auth/callback")}`;
---

{user ? (
  <div class="flex items-center gap-3">
    {user.avatarUrl && (
      <img
        src={user.avatarUrl}
        alt={user.name}
        class="w-8 h-8 rounded-full"
        referrerpolicy="no-referrer"
      />
    )}
    <form method="POST" action="/api/auth/logout">
      <button
        type="submit"
        class="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
      >
        {t(lang, "auth.signOut")}
      </button>
    </form>
  </div>
) : (
  <a
    href={loginUrl}
    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
  >
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
    {t(lang, "auth.signIn")}
  </a>
)}
```

- [ ] **Step 4: Update Navbar to include Docs link and AuthButton**

In `src/components/Navbar.astro`, add `AuthButton` import and "Docs" to `navLinks`:

After the imports, add:
```typescript
import AuthButton from "./AuthButton.astro";
```

In the `navLinks` array, add after the projects entry:
```typescript
{ label: t(lang, "docs.nav"), href: `${prefix}/docs` },
```

In the template, after the language switcher link (desktop nav area), add:
```astro
<AuthButton lang={lang} />
```

Also add it to the mobile menu, before the language switcher.

- [ ] **Step 5: Verify build**

Run: `pnpm build`
Expected: Build succeeds. The Navbar now shows a Docs link and auth button. (Auth won't work yet without Supabase credentials, but it should render.)

- [ ] **Step 6: Commit**

```bash
git add src/components/AuthButton.astro src/components/Navbar.astro src/i18n/es.json src/i18n/en.json
git commit -m "feat: add AuthButton component, Docs nav link, and i18n keys"
```

---

## Chunk 3: Project CRUD API Routes

### Task 7: Create project API routes

**Files:**
- Create: `src/pages/api/projects/index.ts`
- Create: `src/pages/api/projects/[id].ts`

- [ ] **Step 1: Create `src/pages/api/projects/index.ts`**

```typescript
import type { APIRoute } from "astro";
import { createUserClient } from "../../../lib/supabase-server";

export const prerender = false;

// GET /api/projects — list projects for the user's org
export const GET: APIRoute = async ({ locals, cookies }) => {
  if (!locals.isMember || !locals.org) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const supabase = createUserClient(accessToken);
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("org_id", locals.org.orgId)
    .order("priority", { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

// POST /api/projects — create a new project
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  if (!locals.isMember || !locals.org) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const body = await request.json();
  const { name, domain, status, priority, notes } = body;

  if (!name || typeof name !== "string") {
    return new Response(JSON.stringify({ error: "Name is required" }), { status: 400 });
  }

  // Derive folder from name
  const folder = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const supabase = createUserClient(accessToken);
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name,
      folder,
      domain: domain || null,
      status: status || "Planned",
      priority: priority ?? 99,
      notes: notes || null,
      org_id: locals.org.orgId,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
```

- [ ] **Step 2: Create `src/pages/api/projects/[id].ts`**

```typescript
import type { APIRoute } from "astro";
import { createUserClient } from "../../../lib/supabase-server";

export const prerender = false;

// PATCH /api/projects/[id] — update a project
export const PATCH: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember || !locals.org) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const id = params.id;
  const body = await request.json();

  // Only allow updating specific fields
  const allowed = ["name", "domain", "status", "priority", "notes"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  // If name changed, update folder too
  if (updates.name && typeof updates.name === "string") {
    updates.folder = updates.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  const supabase = createUserClient(accessToken);
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

// DELETE /api/projects/[id] — delete a project
export const DELETE: APIRoute = async ({ params, locals, cookies }) => {
  if (!locals.isMember || !locals.org) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const supabase = createUserClient(accessToken);
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", params.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(null, { status: 204 });
};
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/projects/
git commit -m "feat: add project CRUD API routes"
```

---

### Task 8: Create milestone and task API routes

**Files:**
- Create: `src/pages/api/projects/[id]/milestones.ts`
- Create: `src/pages/api/milestones/[id].ts`
- Create: `src/pages/api/milestones/[id]/tasks.ts`
- Create: `src/pages/api/tasks/[id].ts`

- [ ] **Step 1: Create `src/pages/api/projects/[id]/milestones.ts`**

```typescript
import type { APIRoute } from "astro";
import { createUserClient } from "../../../../lib/supabase-server";

export const prerender = false;

// GET /api/projects/[id]/milestones
export const GET: APIRoute = async ({ params, locals, cookies }) => {
  if (!locals.isMember) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const supabase = createUserClient(accessToken);
  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", params.id)
    .order("number", { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

// POST /api/projects/[id]/milestones
export const POST: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const body = await request.json();
  const { number, title, description, status, blocking } = body;

  if (!title || typeof title !== "string") {
    return new Response(JSON.stringify({ error: "Title is required" }), { status: 400 });
  }

  const supabase = createUserClient(accessToken);

  // Auto-assign next number if not provided
  let milestoneNumber = number;
  if (!milestoneNumber) {
    const { data: existing } = await supabase
      .from("milestones")
      .select("number")
      .eq("project_id", params.id)
      .order("number", { ascending: false })
      .limit(1);
    milestoneNumber = (existing?.[0]?.number ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from("milestones")
    .insert({
      project_id: Number(params.id),
      number: milestoneNumber,
      title,
      description: description || null,
      status: status || "Planned",
      blocking: blocking || null,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
```

- [ ] **Step 2: Create `src/pages/api/milestones/[id].ts`**

```typescript
import type { APIRoute } from "astro";
import { createUserClient } from "../../../lib/supabase-server";

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const body = await request.json();
  const allowed = ["title", "description", "status", "blocking", "number"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const supabase = createUserClient(accessToken);
  const { data, error } = await supabase
    .from("milestones")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ params, locals, cookies }) => {
  if (!locals.isMember) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const supabase = createUserClient(accessToken);
  const { error } = await supabase.from("milestones").delete().eq("id", params.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(null, { status: 204 });
};
```

- [ ] **Step 3: Create `src/pages/api/milestones/[id]/tasks.ts`**

```typescript
import type { APIRoute } from "astro";
import { createUserClient } from "../../../../lib/supabase-server";

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const body = await request.json();
  const { description } = body;

  if (!description || typeof description !== "string") {
    return new Response(JSON.stringify({ error: "Description is required" }), { status: 400 });
  }

  const supabase = createUserClient(accessToken);
  const { data, error } = await supabase
    .from("milestone_tasks")
    .insert({
      milestone_id: Number(params.id),
      description,
      done: false,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
```

- [ ] **Step 4: Create `src/pages/api/tasks/[id].ts`**

```typescript
import type { APIRoute } from "astro";
import { createUserClient } from "../../../lib/supabase-server";

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const body = await request.json();
  const allowed = ["description", "done"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const supabase = createUserClient(accessToken);
  const { data, error } = await supabase
    .from("milestone_tasks")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ params, locals, cookies }) => {
  if (!locals.isMember) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const supabase = createUserClient(accessToken);
  const { error } = await supabase.from("milestone_tasks").delete().eq("id", params.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(null, { status: 204 });
};
```

- [ ] **Step 5: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/pages/api/milestones/ src/pages/api/tasks/ src/pages/api/projects/
git commit -m "feat: add milestone and task CRUD API routes"
```

---

## Chunk 4: Document API Routes + Data Layer

### Task 9: Create document API routes and data layer

**Files:**
- Create: `src/pages/api/documents/index.ts`
- Create: `src/pages/api/documents/[id].ts`
- Create: `src/lib/documents-data.ts`

- [ ] **Step 1: Create `src/lib/documents-data.ts`**

```typescript
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";

export interface DocumentSummary {
  id: string;
  slug: string;
  title: string;
  scope: "global" | "project";
  doc_type: string;
  project_id: number | null;
  updated_at: string;
}

export interface DocumentFull extends DocumentSummary {
  content: string;
  org_id: string;
  created_at: string;
}

/**
 * Get all global documents (for the /docs page).
 */
export async function getGlobalDocuments(): Promise<DocumentSummary[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = getSupabaseClient()!;
  const { data, error } = await supabase
    .from("documents")
    .select("id, slug, title, scope, doc_type, project_id, updated_at")
    .eq("scope", "global")
    .order("title", { ascending: true });

  if (error || !data) return [];
  return data as DocumentSummary[];
}

/**
 * Get documents scoped to a specific project.
 */
export async function getProjectDocuments(projectId: number): Promise<DocumentSummary[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = getSupabaseClient()!;
  const { data, error } = await supabase
    .from("documents")
    .select("id, slug, title, scope, doc_type, project_id, updated_at")
    .eq("scope", "project")
    .eq("project_id", projectId)
    .order("title", { ascending: true });

  if (error || !data) return [];
  return data as DocumentSummary[];
}

/**
 * Get a single document by slug (for /docs/[slug]).
 * Tries global scope first, since that's the /docs route.
 */
export async function getDocumentBySlug(slug: string): Promise<DocumentFull | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = getSupabaseClient()!;
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("slug", slug)
    .eq("scope", "global")
    .single();

  if (error || !data) return null;
  return data as DocumentFull;
}
```

- [ ] **Step 2: Create `src/pages/api/documents/index.ts`**

```typescript
import type { APIRoute } from "astro";
import { createUserClient } from "../../../lib/supabase-server";

export const prerender = false;

const MAX_CONTENT_SIZE = 1024 * 1024; // 1MB

// GET /api/documents — list documents (filterable)
export const GET: APIRoute = async ({ url, locals, cookies }) => {
  if (!locals.isMember || !locals.org) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const scope = url.searchParams.get("scope");
  const projectId = url.searchParams.get("project_id");
  const docType = url.searchParams.get("doc_type");

  const supabase = createUserClient(accessToken);
  let query = supabase
    .from("documents")
    .select("id, slug, title, scope, doc_type, project_id, org_id, updated_at")
    .eq("org_id", locals.org.orgId)
    .order("updated_at", { ascending: false });

  if (scope) query = query.eq("scope", scope);
  if (projectId) query = query.eq("project_id", Number(projectId));
  if (docType) query = query.eq("doc_type", docType);

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

// POST /api/documents — create a document
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  if (!locals.isMember || !locals.org) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const body = await request.json();
  const { slug, title, content, scope, project_id, doc_type } = body;

  if (!title || !slug || !doc_type || !scope) {
    return new Response(
      JSON.stringify({ error: "title, slug, scope, and doc_type are required" }),
      { status: 400 }
    );
  }

  if (content && typeof content === "string" && content.length > MAX_CONTENT_SIZE) {
    return new Response(
      JSON.stringify({ error: "Content exceeds 1MB limit" }),
      { status: 400 }
    );
  }

  const supabase = createUserClient(accessToken);
  const { data, error } = await supabase
    .from("documents")
    .insert({
      slug,
      title,
      content: content || "",
      scope,
      project_id: project_id ? Number(project_id) : null,
      org_id: locals.org.orgId,
      doc_type,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
```

- [ ] **Step 3: Create `src/pages/api/documents/[id].ts`**

```typescript
import type { APIRoute } from "astro";
import { createUserClient } from "../../../lib/supabase-server";

export const prerender = false;

const MAX_CONTENT_SIZE = 1024 * 1024; // 1MB

// GET /api/documents/[id]
export const GET: APIRoute = async ({ params, locals, cookies }) => {
  if (!locals.isMember) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const supabase = createUserClient(accessToken);
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

// PATCH /api/documents/[id]
export const PATCH: APIRoute = async ({ params, request, locals, cookies }) => {
  if (!locals.isMember) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const body = await request.json();
  const allowed = ["title", "slug", "content", "doc_type"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (
    updates.content &&
    typeof updates.content === "string" &&
    updates.content.length > MAX_CONTENT_SIZE
  ) {
    return new Response(
      JSON.stringify({ error: "Content exceeds 1MB limit" }),
      { status: 400 }
    );
  }

  const supabase = createUserClient(accessToken);
  const { data, error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};

// DELETE /api/documents/[id]
export const DELETE: APIRoute = async ({ params, locals, cookies }) => {
  if (!locals.isMember) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "No session" }), { status: 401 });
  }

  const supabase = createUserClient(accessToken);
  const { error } = await supabase.from("documents").delete().eq("id", params.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(null, { status: 204 });
};
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/lib/documents-data.ts src/pages/api/documents/
git commit -m "feat: add document CRUD API routes and data layer"
```

---

## Chunk 5: Interactive Project Pages (SSR + Inline CRUD)

### Task 10: Convert projects pages to SSR with inline CRUD

**Files:**
- Modify: `src/pages/projects/index.astro`
- Modify: `src/pages/projects/[slug].astro`
- Modify: `src/pages/en/projects/index.astro`
- Modify: `src/pages/en/projects/[slug].astro`
- Create: `src/components/ProjectForm.astro`
- Create: `src/components/MilestoneForm.astro`

- [ ] **Step 1: Create `src/components/ProjectForm.astro`**

An inline form component for creating/editing projects. Takes optional existing project data for edit mode.

```astro
---
import { t, type Locale } from "../i18n/index";

interface Props {
  lang?: Locale;
  project?: {
    id: number;
    name: string;
    domain: string | null;
    status: string;
    priority: number;
    notes: string | null;
  };
}

const { lang = "es", project } = Astro.props;
const isEdit = !!project;
---

<div class="rounded-xl border-2 border-dashed border-neutral-300 bg-white p-6" data-project-form>
  <form class="space-y-4" data-form={isEdit ? "edit" : "create"} data-project-id={project?.id}>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1">{t(lang, "forms.name")}</label>
        <input
          type="text"
          name="name"
          value={project?.name ?? ""}
          required
          class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1">{t(lang, "forms.domain")}</label>
        <input
          type="text"
          name="domain"
          value={project?.domain ?? ""}
          placeholder="example.com"
          class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1">{t(lang, "forms.status")}</label>
        <select
          name="status"
          class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        >
          {["Planned", "Active", "On Hold", "Done"].map((s) => (
            <option value={s} selected={project?.status === s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1">{t(lang, "forms.priority")}</label>
        <input
          type="number"
          name="priority"
          value={project?.priority ?? 99}
          min="1"
          class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>
    </div>
    <div>
      <label class="block text-sm font-medium text-neutral-700 mb-1">{t(lang, "forms.notes")}</label>
      <textarea
        name="notes"
        rows="2"
        class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      >{project?.notes ?? ""}</textarea>
    </div>
    <div class="flex gap-3">
      <button
        type="submit"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
      >
        {t(lang, "forms.save")}
      </button>
      <button
        type="button"
        data-cancel
        class="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
      >
        {t(lang, "forms.cancel")}
      </button>
    </div>
  </form>
</div>
```

- [ ] **Step 2: Create `src/components/MilestoneForm.astro`**

```astro
---
import { t, type Locale } from "../i18n/index";

interface Props {
  lang?: Locale;
  projectId: number;
  milestone?: {
    id: number;
    number: number;
    title: string;
    description: string | null;
    status: string;
    blocking: string | null;
  };
}

const { lang = "es", projectId, milestone } = Astro.props;
const isEdit = !!milestone;
---

<div class="rounded-lg border border-neutral-200 bg-white p-4 mt-4" data-milestone-form>
  <form class="space-y-3" data-form={isEdit ? "edit" : "create"} data-milestone-id={milestone?.id} data-project-id={projectId}>
    <div>
      <label class="block text-sm font-medium text-neutral-700 mb-1">{t(lang, "forms.milestoneTitle")}</label>
      <input
        type="text"
        name="title"
        value={milestone?.title ?? ""}
        required
        class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
    </div>
    <div>
      <label class="block text-sm font-medium text-neutral-700 mb-1">{t(lang, "forms.milestoneDescription")}</label>
      <textarea
        name="description"
        rows="2"
        class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      >{milestone?.description ?? ""}</textarea>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1">{t(lang, "forms.milestoneStatus")}</label>
        <select
          name="status"
          class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        >
          {["Planned", "In Progress", "Done", "Blocked"].map((s) => (
            <option value={s} selected={milestone?.status === s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-neutral-700 mb-1">{t(lang, "forms.milestoneBlocking")}</label>
        <input
          type="text"
          name="blocking"
          value={milestone?.blocking ?? ""}
          placeholder="M1, M2"
          class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      </div>
    </div>
    <div class="flex gap-3">
      <button
        type="submit"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
      >
        {t(lang, "forms.save")}
      </button>
      <button
        type="button"
        data-cancel
        class="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
      >
        {t(lang, "forms.cancel")}
      </button>
    </div>
  </form>
</div>
```

- [ ] **Step 3: Update `src/pages/projects/index.astro` to SSR with CRUD**

Key changes:
1. Add `export const prerender = false;` at the top of the frontmatter
2. Read `Astro.locals.isMember` to conditionally render CRUD controls
3. Add a "New Project" card at the end of the grid (when authenticated)
4. Add edit icons on each ProjectCard
5. Add inline `<script>` for handling form submissions via fetch

The page keeps `getAllProjects()` for data fetching (works for anonymous via anon key). Add after the project grid, inside the conditional:

```astro
{Astro.locals.isMember && (
  <div
    class="rounded-xl border-2 border-dashed border-neutral-300 bg-white/50 flex items-center justify-center min-h-[200px] cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
    data-add-project-trigger
  >
    <div class="text-center">
      <span class="text-4xl text-neutral-400">+</span>
      <p class="text-sm text-neutral-500 mt-2">{t(lang, "forms.addProject")}</p>
    </div>
  </div>
)}
```

Add inline script at the bottom for form handling (create project via `POST /api/projects`, reload page on success).

- [ ] **Step 4: Update `src/pages/projects/[slug].astro` to SSR with CRUD**

Key changes:
1. Add `export const prerender = false;`
2. Remove `getStaticPaths()` — no longer needed in SSR mode, read slug from `Astro.params.slug`
3. Add edit/delete buttons on milestones (when authenticated)
4. Add "Add Milestone" form at the bottom of the timeline
5. Add task checkboxes that toggle via fetch
6. Add a "Documents" section below the milestone timeline showing project-scoped docs
7. Add inline `<script>` for all CRUD interactions

The documents section (after milestone timeline):

```astro
{/* Documents section */}
<section class="py-16 sm:py-20 bg-neutral-50">
  <Container>
    <SectionHeading
      eyebrow={t(lang, "docs.eyebrow")}
      heading={t(lang, "docs.heading")}
    />
    <div class="mt-10 max-w-3xl mx-auto space-y-4">
      {projectDocs.map((doc) => (
        <DocumentCard doc={doc} lang={lang} />
      ))}
      {Astro.locals.isMember && (
        <button data-add-document class="...">
          + {t(lang, "docs.addDocument")}
        </button>
      )}
    </div>
  </Container>
</section>
```

Import `getProjectDocuments` from `documents-data.ts` and fetch project docs alongside project data.

- [ ] **Step 5: Mirror changes to EN pages**

Copy the same SSR changes to:
- `src/pages/en/projects/index.astro` (change `lang = "en"` and prefix paths with `/en`)
- `src/pages/en/projects/[slug].astro` (change `lang = "en"` and prefix paths with `/en`)

- [ ] **Step 6: Verify dev server works**

Run: `pnpm dev`
Navigate to `http://localhost:4321/projects` — should render the project list. Without Supabase auth configured, no CRUD controls should appear.

- [ ] **Step 7: Commit**

```bash
git add src/components/ProjectForm.astro src/components/MilestoneForm.astro src/pages/projects/ src/pages/en/projects/
git commit -m "feat: convert project pages to SSR with inline CRUD controls"
```

---

## Chunk 6: Document Pages + Markdown Editor

### Task 11: Create the markdown editor component

**Files:**
- Create: `src/components/InlineEditor.astro`

- [ ] **Step 1: Create `src/components/InlineEditor.astro`**

A split-pane markdown editor using `marked` for preview. This component is only loaded for authenticated users, so the JS can reference `marked` directly.

```astro
---
import { t, type Locale } from "../i18n/index";

interface Props {
  documentId?: string;
  content?: string;
  lang?: Locale;
}

const { documentId, content = "", lang = "es" } = Astro.props;
---

<div class="editor-container" data-editor data-document-id={documentId}>
  {/* Toolbar */}
  <div class="flex items-center gap-1 p-2 border-b border-neutral-200 bg-neutral-50 rounded-t-lg">
    <button type="button" data-action="bold" title={t(lang, "editor.bold")} class="p-1.5 rounded hover:bg-neutral-200 text-sm font-bold">B</button>
    <button type="button" data-action="italic" title={t(lang, "editor.italic")} class="p-1.5 rounded hover:bg-neutral-200 text-sm italic">I</button>
    <button type="button" data-action="heading" title={t(lang, "editor.heading")} class="p-1.5 rounded hover:bg-neutral-200 text-sm font-bold">H</button>
    <button type="button" data-action="link" title={t(lang, "editor.link")} class="p-1.5 rounded hover:bg-neutral-200 text-sm">🔗</button>
    <button type="button" data-action="code" title={t(lang, "editor.code")} class="p-1.5 rounded hover:bg-neutral-200 text-sm font-mono">{`</>`}</button>
    <button type="button" data-action="list" title={t(lang, "editor.list")} class="p-1.5 rounded hover:bg-neutral-200 text-sm">•</button>
    <div class="flex-1" />
    <button type="button" data-tab="write" class="px-3 py-1 text-sm font-medium rounded bg-white border border-neutral-300">{t(lang, "editor.write")}</button>
    <button type="button" data-tab="preview" class="px-3 py-1 text-sm text-neutral-500 rounded hover:bg-neutral-200">{t(lang, "editor.preview")}</button>
  </div>

  {/* Editor panes */}
  <div class="relative min-h-[400px]">
    <textarea
      data-textarea
      class="absolute inset-0 w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none"
      placeholder="Write markdown..."
    >{content}</textarea>
    <div
      data-preview
      class="absolute inset-0 w-full h-full p-4 overflow-y-auto prose prose-sm max-w-none hidden"
    />
  </div>

  {/* Actions */}
  <div class="flex gap-3 p-3 border-t border-neutral-200 bg-neutral-50 rounded-b-lg">
    <button
      type="button"
      data-save
      class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
    >
      {t(lang, "docs.save")}
    </button>
    <button
      type="button"
      data-editor-cancel
      class="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
    >
      {t(lang, "docs.cancel")}
    </button>
  </div>
</div>

<script>
  import { marked } from "marked";

  document.querySelectorAll("[data-editor]").forEach((editor) => {
    const textarea = editor.querySelector("[data-textarea]") as HTMLTextAreaElement;
    const preview = editor.querySelector("[data-preview]") as HTMLDivElement;
    const documentId = (editor as HTMLElement).dataset.documentId;

    // Tab switching
    editor.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = (btn as HTMLElement).dataset.tab;
        if (tab === "preview") {
          preview.innerHTML = marked.parse(textarea.value) as string;
          textarea.classList.add("hidden");
          preview.classList.remove("hidden");
        } else {
          textarea.classList.remove("hidden");
          preview.classList.add("hidden");
        }
        // Update active tab styles
        editor.querySelectorAll("[data-tab]").forEach((b) => {
          b.classList.toggle("bg-white", (b as HTMLElement).dataset.tab === tab);
          b.classList.toggle("border", (b as HTMLElement).dataset.tab === tab);
          b.classList.toggle("border-neutral-300", (b as HTMLElement).dataset.tab === tab);
          b.classList.toggle("text-neutral-500", (b as HTMLElement).dataset.tab !== tab);
        });
      });
    });

    // Toolbar actions
    const insertAtCursor = (before: string, after: string = "") => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.substring(start, end);
      textarea.value =
        textarea.value.substring(0, start) +
        before + selected + after +
        textarea.value.substring(end);
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selected.length;
    };

    editor.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = (btn as HTMLElement).dataset.action;
        switch (action) {
          case "bold": insertAtCursor("**", "**"); break;
          case "italic": insertAtCursor("_", "_"); break;
          case "heading": insertAtCursor("## "); break;
          case "link": insertAtCursor("[", "](url)"); break;
          case "code": insertAtCursor("```\n", "\n```"); break;
          case "list": insertAtCursor("- "); break;
        }
      });
    });

    // Save
    editor.querySelector("[data-save]")?.addEventListener("click", async () => {
      if (!documentId) return;
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: textarea.value }),
      });
      if (res.ok) {
        window.location.reload();
      }
    });

    // Cancel
    editor.querySelector("[data-editor-cancel]")?.addEventListener("click", () => {
      window.location.reload();
    });
  });
</script>
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds. `marked` import works in the client script.

- [ ] **Step 3: Commit**

```bash
git add src/components/InlineEditor.astro
git commit -m "feat: add markdown split-pane editor component"
```

---

### Task 12: Create document pages

**Files:**
- Create: `src/components/DocumentCard.astro`
- Create: `src/pages/docs/index.astro`
- Create: `src/pages/docs/[slug].astro`
- Create: `src/pages/en/docs/index.astro`
- Create: `src/pages/en/docs/[slug].astro`

- [ ] **Step 1: Create `src/components/DocumentCard.astro`**

```astro
---
import Badge from "./Badge.astro";
import { t, type Locale } from "../i18n/index";
import type { DocumentSummary } from "../lib/documents-data";

interface Props {
  doc: DocumentSummary;
  href: string;
  lang?: Locale;
  editable?: boolean;
}

const { doc, href, lang = "es", editable = false } = Astro.props;

const typeColors: Record<string, "success" | "primary" | "warning" | "default" | "error"> = {
  prospect: "primary",
  lineament: "success",
  bitacora: "warning",
  spec: "default",
  custom: "default",
};

const updated = new Date(doc.updated_at).toLocaleDateString(lang === "es" ? "es-CL" : "en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});
---

<a
  href={href}
  class="flex items-center justify-between p-4 rounded-lg border border-neutral-200 bg-white hover:border-primary-200 hover:shadow-sm transition-all group"
>
  <div class="flex items-center gap-3">
    <div class="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <div>
      <h3 class="text-sm font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">{doc.title}</h3>
      <p class="text-xs text-neutral-400 mt-0.5">{updated}</p>
    </div>
  </div>
  <Badge variant={typeColors[doc.doc_type] ?? "default"}>{doc.doc_type}</Badge>
</a>
```

- [ ] **Step 2: Create `src/pages/docs/index.astro`**

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import Navbar from "@/components/Navbar.astro";
import Footer from "@/components/Footer.astro";
import Container from "@/components/Container.astro";
import SectionHeading from "@/components/SectionHeading.astro";
import DocumentCard from "@/components/DocumentCard.astro";
import CtaBanner from "@/components/CtaBanner.astro";
import { t } from "../../i18n/index";
import { getGlobalDocuments } from "../../lib/documents-data";

export const prerender = false;

const lang = "es";
const documents = await getGlobalDocuments();
const isMember = Astro.locals.isMember;
---

<BaseLayout
  title={t(lang, "docs.heading") + " — TopNotch"}
  description={t(lang, "docs.subheading")}
  url="/docs"
  breadcrumbs={[{ name: "Inicio", url: "/" }, { name: t(lang, "docs.nav"), url: "/docs" }]}
  lang={lang}
>
  <Navbar lang={lang} />

  <main>
    <section class="pt-24 pb-20 sm:pt-32 sm:pb-28 bg-neutral-50">
      <Container>
        <SectionHeading
          eyebrow={t(lang, "docs.eyebrow")}
          heading={t(lang, "docs.heading")}
          subheading={t(lang, "docs.subheading")}
          align="center"
          as="h1"
        />

        <div class="mt-14 max-w-3xl mx-auto space-y-3">
          {documents.length === 0 && (
            <p class="text-center text-neutral-500">{t(lang, "docs.noDocuments")}</p>
          )}
          {documents.map((doc) => (
            <DocumentCard doc={doc} href={`/docs/${doc.slug}`} lang={lang} editable={isMember} />
          ))}
          {isMember && (
            <button
              data-add-document
              class="w-full p-4 rounded-lg border-2 border-dashed border-neutral-300 text-neutral-500 hover:border-primary-400 hover:text-primary-600 transition-colors text-sm"
            >
              + {t(lang, "docs.addDocument")}
            </button>
          )}
        </div>
      </Container>
    </section>

    <CtaBanner lang={lang} />
  </main>

  <Footer lang={lang} />
</BaseLayout>

<script>
  // No-op for anonymous users — querySelector returns null when the button isn't rendered
  document.querySelector("[data-add-document]")?.addEventListener("click", async () => {
    const title = prompt("Document title:");
    if (!title) return;
    const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const docType = prompt("Type (prospect, lineament, bitacora, spec, custom):", "lineament");
    if (!docType) return;

    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, doc_type: docType, scope: "global", content: "" }),
    });

    if (res.ok) {
      const doc = await res.json();
      window.location.href = `/docs/${doc.slug}`;
    }
  });
</script>
```

- [ ] **Step 3: Create `src/pages/docs/[slug].astro`**

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import Navbar from "@/components/Navbar.astro";
import Footer from "@/components/Footer.astro";
import Container from "@/components/Container.astro";
import InlineEditor from "@/components/InlineEditor.astro";
import { t } from "../../i18n/index";
import { getDocumentBySlug } from "../../lib/documents-data";
import { marked } from "marked";

export const prerender = false;

const lang = "es";
const slug = Astro.params.slug!;
const doc = await getDocumentBySlug(slug);

if (!doc) {
  return Astro.redirect("/404");
}

const isMember = Astro.locals.isMember;
const renderedContent = marked.parse(doc.content) as string;
const editing = Astro.url.searchParams.get("edit") === "true" && isMember;
---

<BaseLayout
  title={`${doc.title} — TopNotch`}
  description={`${doc.doc_type} document`}
  url={`/docs/${slug}`}
  breadcrumbs={[
    { name: "Inicio", url: "/" },
    { name: t(lang, "docs.nav"), url: "/docs" },
    { name: doc.title, url: `/docs/${slug}` },
  ]}
  lang={lang}
>
  <Navbar lang={lang} />

  <main>
    <section class="pt-24 pb-20 sm:pt-32 sm:pb-28">
      <Container>
        <a
          href="/docs"
          class="inline-flex items-center text-sm text-neutral-500 hover:text-primary-600 transition-colors mb-6"
        >
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t(lang, "docs.nav")}
        </a>

        <div class="flex items-start justify-between mb-8">
          <h1 class="font-heading text-3xl sm:text-4xl font-bold text-neutral-900">{doc.title}</h1>
          {isMember && !editing && (
            <a
              href={`/docs/${slug}?edit=true`}
              class="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
            >
              {t(lang, "docs.edit")}
            </a>
          )}
        </div>

        {editing ? (
          <div class="max-w-4xl border border-neutral-200 rounded-lg overflow-hidden">
            <InlineEditor documentId={doc.id} content={doc.content} lang={lang} />
          </div>
        ) : (
          <div class="prose prose-neutral max-w-4xl" set:html={renderedContent} />
        )}
      </Container>
    </section>
  </main>

  <Footer lang={lang} />
</BaseLayout>
```

- [ ] **Step 4: Create EN versions**

Duplicate `src/pages/docs/index.astro` → `src/pages/en/docs/index.astro` with `lang = "en"` and `/en` prefixed paths.

Duplicate `src/pages/docs/[slug].astro` → `src/pages/en/docs/[slug].astro` with `lang = "en"` and `/en` prefixed paths.

- [ ] **Step 5: Verify dev server**

Run: `pnpm dev`
Navigate to `http://localhost:4321/docs` — should show the documents page (empty list without Supabase).

- [ ] **Step 6: Commit**

```bash
git add src/components/DocumentCard.astro src/pages/docs/ src/pages/en/docs/
git commit -m "feat: add global documents pages with markdown editor"
```

---

## Chunk 7: Integration + Final Wiring

### Task 13: Update project detail page with documents section and inline scripts

**Files:**
- Modify: `src/pages/projects/[slug].astro`
- Modify: `src/pages/en/projects/[slug].astro`

- [ ] **Step 1: Add documents section and all inline CRUD scripts to `[slug].astro`**

This is the most complex page. It needs a single `<script>` block at the bottom that handles:

1. **Task checkbox toggling:** Click a checkbox → `PATCH /api/tasks/[id]` with `{done: !current}`
2. **Add task:** Input + Enter → `POST /api/milestones/[id]/tasks`
3. **Edit milestone:** Click pencil → show MilestoneForm, submit → `PATCH /api/milestones/[id]`
4. **Delete milestone:** Click trash → confirm → `DELETE /api/milestones/[id]`
5. **Add milestone:** Click "Add Milestone" button → show MilestoneForm, submit → `POST /api/projects/[id]/milestones`
6. **Project header inline edit:** Click field → becomes input, blur/Enter → `PATCH /api/projects/[id]`
7. **Add document:** Button → prompt → `POST /api/documents` with `scope: 'project'`

All handlers use `fetch()` and either update the DOM directly or reload the page on success.

The documents section should be added after the milestone timeline section, importing `DocumentCard` and `getProjectDocuments`, and fetching docs in the frontmatter alongside the project data.

- [ ] **Step 2: Mirror to EN version**

Apply the same changes to `src/pages/en/projects/[slug].astro`.

- [ ] **Step 3: Verify dev server**

Run: `pnpm dev`
Test all CRUD interactions (will need Supabase configured with auth for full testing).

- [ ] **Step 4: Commit**

```bash
git add src/pages/projects/[slug].astro src/pages/en/projects/[slug].astro
git commit -m "feat: add inline CRUD scripts and documents section to project detail"
```

---

### Task 14: Update projects index with inline CRUD scripts

**Files:**
- Modify: `src/pages/projects/index.astro`
- Modify: `src/pages/en/projects/index.astro`

- [ ] **Step 1: Add inline scripts for project creation and editing**

Add a `<script>` block at the bottom of the page that handles:

1. **Add project trigger:** Click the "+" card → replace it with a `ProjectForm` (dynamically insert the HTML or toggle a hidden form)
2. **Form submit:** Collect form data → `POST /api/projects` → reload page
3. **Cancel:** Hide form, show trigger card again
4. **Edit project:** Click pencil on a card → navigate to project detail with edit mode, or expand inline

Since Astro components can't be dynamically rendered client-side, use a simple approach: include a hidden ProjectForm at the bottom, show/hide it with JS.

- [ ] **Step 2: Mirror to EN version**

- [ ] **Step 3: Verify and commit**

```bash
git add src/pages/projects/index.astro src/pages/en/projects/index.astro
git commit -m "feat: add project creation UI to projects index page"
```

---

### Task 15: Push migration to Supabase and test end-to-end

**Files:** None (operational task)

- [ ] **Step 1: Push migration**

Run: `cd /home/feland/SideProjects/top-notch-projects/top-notch && supabase db push`
Expected: Migration 00004 applies without errors.

- [ ] **Step 2: Add yourself as org member**

Using Supabase dashboard or SQL editor, insert your user ID into `org_members`:

```sql
INSERT INTO org_members (org_id, user_id, role)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '<your-supabase-auth-user-id>',
  'owner'
);
```

- [ ] **Step 3: Configure Google OAuth redirect**

In Supabase Dashboard → Auth → URL Configuration:
- Add `http://localhost:4321/api/auth/callback` as allowed redirect URL

- [ ] **Step 4: Test login flow**

Run: `pnpm dev`
1. Click "Sign in" → redirects to Google OAuth → callback sets cookie → page reloads with avatar
2. Verify CRUD controls appear on `/projects`
3. Create a project → verify it appears
4. Navigate to project detail → add a milestone → toggle a task
5. Navigate to `/docs` → create a document → edit it with the markdown editor
6. Click "Sign out" → verify CRUD controls disappear

- [ ] **Step 5: Push to Netlify and test production**

```bash
git push origin main
```

Set env vars on Netlify:
```bash
npx netlify env:set SUPABASE_URL "https://<ref>.supabase.co"
npx netlify env:set SUPABASE_ANON_KEY "<anon key>"
npx netlify env:set SUPABASE_SERVICE_ROLE_KEY "<service role key>"  # optional, for future automation
```

Add production callback URL to Supabase Auth allowed redirects:
`https://topnotch-cl.netlify.app/api/auth/callback`

- [ ] **Step 6: Final commit with BITACORA entry**

Write a BITACORA entry summarizing the milestone, then commit.

```bash
git add docs/BITACORA.md
git commit -m "docs: add BITACORA entry for web management platform milestone"
```

---

## Task Dependency Graph

```
Task 1 (migration) ──────────────────────────┐
Task 2 (deps + hybrid mode) ─────────────────┤
Task 3 (supabase-server + auth helpers) ──────┼── Task 4 (middleware)
                                              │
Task 4 ───── Task 5 (auth routes) ────────────┼── Task 6 (AuthButton + Navbar)
                                              │
Task 3 ───── Task 7 (project API) ────────────┤
Task 3 ───── Task 8 (milestone/task API) ─────┤
Task 3 ───── Task 9 (document API + data) ────┤
                                              │
Task 6 + 7 ─── Task 10 (SSR project pages) ──┤
Task 9 ──────── Task 11 (markdown editor) ────┤
Task 10 + 11 ── Task 12 (document pages) ─────┤
                                              │
Task 10 + 11 + 12 ── Task 13 (project detail wiring) ──┤
Task 10 ──────────── Task 14 (projects index wiring) ───┤
                                                        │
Task 13 + 14 ── Task 15 (integration test + deploy) ────┘
```

Tasks 1-3 can run in parallel. Tasks 7, 8, 9 can run in parallel (after Task 3). Tasks 13 and 14 can run in parallel.
