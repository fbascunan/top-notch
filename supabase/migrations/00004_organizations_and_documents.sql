-- Organizations, org membership, documents, and org-scoped RLS
-- Replaces flat open policies with org-based access control

------------------------------------------------------------
-- 1. ORGANIZATIONS TABLE
------------------------------------------------------------
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

------------------------------------------------------------
-- 2. ORG_MEMBERS TABLE
------------------------------------------------------------
CREATE TABLE org_members (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id  UUID NOT NULL,
  role     TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  UNIQUE (org_id, user_id)
);

------------------------------------------------------------
-- 3. DOCUMENTS TABLE
------------------------------------------------------------
CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL,
  title       TEXT NOT NULL,
  content     TEXT,
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

------------------------------------------------------------
-- 4. ADD org_id TO PROJECTS
------------------------------------------------------------
ALTER TABLE projects ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Seed the TopNotch organization
INSERT INTO organizations (id, name, slug)
VALUES ('a0000000-0000-0000-0000-000000000001', 'TopNotch', 'topnotch');

-- Assign all existing projects to TopNotch org
UPDATE projects SET org_id = 'a0000000-0000-0000-0000-000000000001';

-- Now enforce NOT NULL
ALTER TABLE projects ALTER COLUMN org_id SET NOT NULL;

------------------------------------------------------------
-- 5. DROP OLD RLS POLICIES (from 00002)
------------------------------------------------------------
DROP POLICY "anon_read_projects" ON projects;
DROP POLICY "anon_read_milestones" ON milestones;
DROP POLICY "anon_read_milestone_tasks" ON milestone_tasks;
DROP POLICY "anon_read_run_history" ON run_history;
DROP POLICY "authenticated_all_projects" ON projects;
DROP POLICY "authenticated_all_milestones" ON milestones;
DROP POLICY "authenticated_all_milestone_tasks" ON milestone_tasks;
DROP POLICY "authenticated_all_run_history" ON run_history;

------------------------------------------------------------
-- 6. NEW ORG-SCOPED RLS POLICIES
------------------------------------------------------------

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ── Organizations ──

CREATE POLICY "anon_read_organizations" ON organizations
  FOR SELECT TO anon USING (true);

CREATE POLICY "authenticated_read_organizations" ON organizations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "members_all_organizations" ON organizations
  FOR ALL TO authenticated
  USING (id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- ── Org Members ──

CREATE POLICY "authenticated_read_own_org_members" ON org_members
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- ── Projects ──

CREATE POLICY "anon_read_projects" ON projects
  FOR SELECT TO anon USING (true);

CREATE POLICY "authenticated_read_projects" ON projects
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "members_all_projects" ON projects
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- ── Milestones ──

CREATE POLICY "anon_read_milestones" ON milestones
  FOR SELECT TO anon USING (true);

CREATE POLICY "authenticated_read_milestones" ON milestones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "members_all_milestones" ON milestones
  FOR ALL TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN org_members om ON om.org_id = p.org_id
      WHERE om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN org_members om ON om.org_id = p.org_id
      WHERE om.user_id = auth.uid()
    )
  );

-- ── Milestone Tasks ──

CREATE POLICY "anon_read_milestone_tasks" ON milestone_tasks
  FOR SELECT TO anon USING (true);

CREATE POLICY "authenticated_read_milestone_tasks" ON milestone_tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "members_all_milestone_tasks" ON milestone_tasks
  FOR ALL TO authenticated
  USING (
    milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN projects p ON p.id = m.project_id
      JOIN org_members om ON om.org_id = p.org_id
      WHERE om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN projects p ON p.id = m.project_id
      JOIN org_members om ON om.org_id = p.org_id
      WHERE om.user_id = auth.uid()
    )
  );

-- ── Run History ──

CREATE POLICY "anon_read_run_history" ON run_history
  FOR SELECT TO anon USING (true);

CREATE POLICY "authenticated_read_run_history" ON run_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "members_all_run_history" ON run_history
  FOR ALL TO authenticated
  USING (
    milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN projects p ON p.id = m.project_id
      JOIN org_members om ON om.org_id = p.org_id
      WHERE om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    milestone_id IN (
      SELECT m.id FROM milestones m
      JOIN projects p ON p.id = m.project_id
      JOIN org_members om ON om.org_id = p.org_id
      WHERE om.user_id = auth.uid()
    )
  );

-- ── Documents ──

CREATE POLICY "anon_read_documents" ON documents
  FOR SELECT TO anon
  USING (scope IN ('global', 'project'));

CREATE POLICY "authenticated_read_documents" ON documents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "members_all_documents" ON documents
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

------------------------------------------------------------
-- 7. INDEXES
------------------------------------------------------------
CREATE INDEX idx_documents_org ON documents(org_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_scope ON documents(scope);
CREATE INDEX idx_org_members_user ON org_members(user_id);
