-- Fix: org_members SELECT policy was self-referencing, causing empty results.
-- The subquery `SELECT org_id FROM org_members WHERE user_id = auth.uid()`
-- was itself subject to the same RLS policy, creating a circular dependency
-- that always resolved to zero rows.
--
-- Fix: allow authenticated users to read their OWN membership rows directly.

DROP POLICY "authenticated_read_own_org_members" ON org_members;

CREATE POLICY "authenticated_read_own_org_members" ON org_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
