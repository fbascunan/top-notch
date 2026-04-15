-- Migration: human_actions table
-- Stores parsed human-action items from HUMAN-ACTIONS.md files

-- Status enum for human actions
CREATE TYPE human_action_status AS ENUM ('pending', 'done');

CREATE TABLE human_actions (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id  BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone   TEXT NOT NULL,             -- e.g. "M19", "From Previous Milestones"
  description TEXT NOT NULL,
  is_blocker  BOOLEAN NOT NULL DEFAULT false,
  status      human_action_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_human_actions_project_id ON human_actions(project_id);
CREATE INDEX idx_human_actions_status ON human_actions(status);

-- Trigger: set completed_at when status changes to 'done'
CREATE OR REPLACE FUNCTION set_human_action_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    NEW.completed_at = now();
  ELSIF NEW.status = 'pending' AND OLD.status = 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_human_action_completed_at
  BEFORE UPDATE ON human_actions
  FOR EACH ROW
  EXECUTE FUNCTION set_human_action_completed_at();

-- RLS
ALTER TABLE human_actions ENABLE ROW LEVEL SECURITY;

-- Read: org members can read actions for their org's projects
CREATE POLICY "org_members_read_human_actions"
  ON human_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN org_members om ON om.org_id = p.org_id
      WHERE p.id = human_actions.project_id
        AND om.user_id = auth.uid()
    )
  );

-- Insert: org members can insert actions for their org's projects
CREATE POLICY "org_members_insert_human_actions"
  ON human_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN org_members om ON om.org_id = p.org_id
      WHERE p.id = human_actions.project_id
        AND om.user_id = auth.uid()
    )
  );

-- Update: org members can update status for their org's projects
CREATE POLICY "org_members_update_human_actions"
  ON human_actions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN org_members om ON om.org_id = p.org_id
      WHERE p.id = human_actions.project_id
        AND om.user_id = auth.uid()
    )
  );

-- Delete: org members can delete actions for their org's projects
CREATE POLICY "org_members_delete_human_actions"
  ON human_actions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN org_members om ON om.org_id = p.org_id
      WHERE p.id = human_actions.project_id
        AND om.user_id = auth.uid()
    )
  );
