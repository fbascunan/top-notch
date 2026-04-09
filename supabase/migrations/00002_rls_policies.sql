-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_history ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by build-time fetching and sync utility)
-- The service_role key bypasses RLS by default in Supabase,
-- but we add explicit policies for the anon/authenticated roles.

-- Anon role: read-only access (public dashboard)
CREATE POLICY "anon_read_projects" ON projects
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_milestones" ON milestones
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_milestone_tasks" ON milestone_tasks
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_read_run_history" ON run_history
  FOR SELECT TO anon USING (true);

-- Authenticated role: full CRUD (admin/agent operations)
CREATE POLICY "authenticated_all_projects" ON projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_milestones" ON milestones
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_milestone_tasks" ON milestone_tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_run_history" ON run_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
