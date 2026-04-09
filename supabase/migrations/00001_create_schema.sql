-- Core schema for project/milestone tracking
-- Replaces flat-file MILESTONES.md with a queryable database

-- Custom enum types
CREATE TYPE project_status AS ENUM ('Active', 'Planned', 'On Hold', 'Done');
CREATE TYPE milestone_status AS ENUM ('Planned', 'In Progress', 'Done', 'Blocked');
CREATE TYPE run_status AS ENUM ('success', 'failure', 'running');

-- Projects table
CREATE TABLE projects (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        TEXT NOT NULL,
  folder      TEXT NOT NULL UNIQUE,
  domain      TEXT,
  status      project_status NOT NULL DEFAULT 'Planned',
  priority    INT NOT NULL DEFAULT 99,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Milestones table
CREATE TABLE milestones (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id    BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number        INT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  status        milestone_status NOT NULL DEFAULT 'Planned',
  blocking      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  UNIQUE (project_id, number)
);

-- Milestone tasks table
CREATE TABLE milestone_tasks (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  milestone_id  BIGINT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  done          BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Run history table
CREATE TABLE run_history (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  milestone_id  BIGINT NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ,
  status        run_status NOT NULL DEFAULT 'running',
  exit_code     INT,
  logs          TEXT
);

-- Indexes for common queries
CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestone_tasks_milestone ON milestone_tasks(milestone_id);
CREATE INDEX idx_run_history_milestone ON run_history(milestone_id);
CREATE INDEX idx_projects_priority ON projects(priority);

-- Auto-update updated_at on projects
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
