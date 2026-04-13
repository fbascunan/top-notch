/**
 * Data fetching layer for run history.
 * Used by project pages and the global /runs page.
 */

import { getSupabaseClient, isSupabaseConfigured } from "./supabase";
import { seedRunHistory } from "./seed-data";
import type { RunStatus } from "./database.types";

export interface RunHistoryEntry {
  id: number;
  project_id: number;
  milestone_id: number;
  status: RunStatus;
  triggered_by: string | null;
  started_at: string;
  finished_at: string | null;
  logs: string | null;
  commit_sha: string | null;
  error: string | null;
  created_at: string;
  project_name?: string;
  project_folder?: string;
  milestone_number?: number;
  milestone_title?: string;
}

function buildFromSeed(projectId?: number): RunHistoryEntry[] {
  let runs = seedRunHistory.map((r) => ({
    ...r,
    project_name: undefined as string | undefined,
    project_folder: undefined as string | undefined,
    milestone_number: undefined as number | undefined,
    milestone_title: undefined as string | undefined,
  }));
  if (projectId) {
    runs = runs.filter((r) => r.project_id === projectId);
  }
  return runs.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

export async function getRunHistoryForProject(projectId: number): Promise<RunHistoryEntry[]> {
  if (!isSupabaseConfigured) {
    return buildFromSeed(projectId);
  }

  const supabase = getSupabaseClient()!;
  const { data, error } = await supabase
    .from("run_history")
    .select("*, projects(name, folder), milestones(number, title)")
    .eq("project_id", projectId)
    .order("started_at", { ascending: false })
    .limit(20);

  if (error || !data) {
    return buildFromSeed(projectId);
  }

  return data.map((r: any) => ({
    id: r.id,
    project_id: r.project_id,
    milestone_id: r.milestone_id,
    status: r.status,
    triggered_by: r.triggered_by,
    started_at: r.started_at,
    finished_at: r.finished_at,
    logs: r.logs,
    commit_sha: r.commit_sha,
    error: r.error,
    created_at: r.created_at,
    project_name: r.projects?.name,
    project_folder: r.projects?.folder,
    milestone_number: r.milestones?.number,
    milestone_title: r.milestones?.title,
  }));
}

export async function getAllRunHistory(): Promise<RunHistoryEntry[]> {
  if (!isSupabaseConfigured) {
    return buildFromSeed();
  }

  const supabase = getSupabaseClient()!;
  const { data, error } = await supabase
    .from("run_history")
    .select("*, projects(name, folder), milestones(number, title)")
    .order("started_at", { ascending: false })
    .limit(50);

  if (error || !data) {
    return buildFromSeed();
  }

  return data.map((r: any) => ({
    id: r.id,
    project_id: r.project_id,
    milestone_id: r.milestone_id,
    status: r.status,
    triggered_by: r.triggered_by,
    started_at: r.started_at,
    finished_at: r.finished_at,
    logs: r.logs,
    commit_sha: r.commit_sha,
    error: r.error,
    created_at: r.created_at,
    project_name: r.projects?.name,
    project_folder: r.projects?.folder,
    milestone_number: r.milestones?.number,
    milestone_title: r.milestones?.title,
  }));
}

export async function hasActiveRun(projectId: number): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return seedRunHistory.some(
      (r) => r.project_id === projectId && (r.status === "queued" || r.status === "running"),
    );
  }

  const supabase = getSupabaseClient()!;
  const { data } = await supabase
    .from("run_history")
    .select("id")
    .eq("project_id", projectId)
    .in("status", ["queued", "running"])
    .limit(1);

  return (data?.length ?? 0) > 0;
}

export function formatDuration(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}
