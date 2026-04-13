-- M19: Expand run_history table to track milestone runner executions
-- Adds project_id, triggered_by, commit_sha, error columns
-- Replaces old run_status enum with richer status values

------------------------------------------------------------
-- 1. REPLACE run_status ENUM
------------------------------------------------------------
-- Rename old enum, create new one, migrate column, drop old
ALTER TYPE run_status RENAME TO run_status_old;

CREATE TYPE run_status AS ENUM ('queued', 'running', 'completed', 'failed');

ALTER TABLE run_history
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE run_status
    USING CASE status::text
      WHEN 'running' THEN 'running'::run_status
      WHEN 'success' THEN 'completed'::run_status
      WHEN 'failure' THEN 'failed'::run_status
    END,
  ALTER COLUMN status SET DEFAULT 'queued';

DROP TYPE run_status_old;

------------------------------------------------------------
-- 2. ADD NEW COLUMNS
------------------------------------------------------------
ALTER TABLE run_history
  ADD COLUMN project_id    BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  ADD COLUMN triggered_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN commit_sha    TEXT,
  ADD COLUMN error         TEXT,
  ADD COLUMN created_at    TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill project_id from milestone → project relationship
UPDATE run_history rh
SET project_id = m.project_id
FROM milestones m
WHERE rh.milestone_id = m.id;

-- Now enforce NOT NULL on project_id
ALTER TABLE run_history ALTER COLUMN project_id SET NOT NULL;

------------------------------------------------------------
-- 3. INDEXES
------------------------------------------------------------
CREATE INDEX idx_run_history_project ON run_history(project_id);
CREATE INDEX idx_run_history_status ON run_history(status);

------------------------------------------------------------
-- 4. UPDATE RLS POLICIES
------------------------------------------------------------
-- Drop existing run_history policies
DROP POLICY IF EXISTS "anon_read_run_history" ON run_history;
DROP POLICY IF EXISTS "authenticated_read_run_history" ON run_history;
DROP POLICY IF EXISTS "members_all_run_history" ON run_history;

-- Org members can read all runs for their org's projects
CREATE POLICY "org_members_read_run_history" ON run_history
  FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN org_members om ON om.org_id = p.org_id
      WHERE om.user_id = auth.uid()
    )
  );

-- Anon users: no access (blocks anonymous users)
-- (No anon policy = denied by default with RLS enabled)

-- Insert/update scoped to service role only
-- Service role bypasses RLS by default in Supabase, so no explicit policy needed.
-- Authenticated users who are org members can also insert/update for web UI triggers.
CREATE POLICY "org_members_insert_run_history" ON run_history
  FOR INSERT TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN org_members om ON om.org_id = p.org_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "org_members_update_run_history" ON run_history
  FOR UPDATE TO authenticated
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
