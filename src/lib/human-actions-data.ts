/**
 * Data fetching layer for human actions.
 * Used by project detail pages and the global /human-actions page.
 */

import { getSupabaseClient, isSupabaseConfigured } from "./supabase";
import { seedHumanActions } from "./seed-data";
import type { HumanActionStatus } from "./database.types";

export interface HumanAction {
  id: number;
  project_id: number;
  milestone: string;
  description: string;
  is_blocker: boolean;
  status: HumanActionStatus;
  created_at: string;
  completed_at: string | null;
  project_name?: string;
  project_folder?: string;
}

function buildFromSeed(projectId?: number): HumanAction[] {
  let actions = seedHumanActions.map((a) => ({
    ...a,
    created_at: "2026-04-12T00:00:00Z",
    project_name: undefined as string | undefined,
    project_folder: undefined as string | undefined,
  }));
  if (projectId) {
    actions = actions.filter((a) => a.project_id === projectId);
  }
  return actions;
}

export async function getHumanActionsForProject(projectId: number): Promise<HumanAction[]> {
  if (!isSupabaseConfigured) {
    return buildFromSeed(projectId);
  }

  const supabase = getSupabaseClient()!;
  const { data, error } = await supabase
    .from("human_actions")
    .select("*, projects(name, folder)")
    .eq("project_id", projectId)
    .order("milestone", { ascending: true })
    .order("is_blocker", { ascending: false });

  if (error || !data) {
    return buildFromSeed(projectId);
  }

  return data.map((a: any) => ({
    id: a.id,
    project_id: a.project_id,
    milestone: a.milestone,
    description: a.description,
    is_blocker: a.is_blocker,
    status: a.status,
    created_at: a.created_at,
    completed_at: a.completed_at,
    project_name: a.projects?.name,
    project_folder: a.projects?.folder,
  }));
}

export async function getAllHumanActions(): Promise<HumanAction[]> {
  if (!isSupabaseConfigured) {
    return buildFromSeed();
  }

  const supabase = getSupabaseClient()!;
  const { data, error } = await supabase
    .from("human_actions")
    .select("*, projects(name, folder)")
    .order("status", { ascending: true })
    .order("is_blocker", { ascending: false })
    .order("milestone", { ascending: true });

  if (error || !data) {
    return buildFromSeed();
  }

  return data.map((a: any) => ({
    id: a.id,
    project_id: a.project_id,
    milestone: a.milestone,
    description: a.description,
    is_blocker: a.is_blocker,
    status: a.status,
    created_at: a.created_at,
    completed_at: a.completed_at,
    project_name: a.projects?.name,
    project_folder: a.projects?.folder,
  }));
}

/** Group actions by milestone label */
export function groupByMilestone(actions: HumanAction[]): Map<string, HumanAction[]> {
  const grouped = new Map<string, HumanAction[]>();
  for (const action of actions) {
    const key = action.milestone;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(action);
  }
  return grouped;
}
