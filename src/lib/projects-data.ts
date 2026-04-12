/**
 * Data fetching layer for projects and milestones.
 * Fetches from Supabase at build time; falls back to seed data when env vars are missing.
 */

import { getSupabaseClient, isSupabaseConfigured } from "./supabase";
import { seedProjects, seedMilestones } from "./seed-data";
import type { MilestoneStatus } from "./database.types";

export interface ProjectWithProgress {
  id: number;
  name: string;
  slug: string;
  folder: string;
  domain: string | null;
  status: string;
  priority: number;
  notes: string | null;
  totalMilestones: number;
  doneMilestones: number;
  progressPercent: number;
}

export interface MilestoneDetail {
  id: number;
  number: number;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  blocking: string | null;
  totalTasks: number;
  doneTasks: number;
}

export interface ProjectDetail extends ProjectWithProgress {
  milestones: MilestoneDetail[];
}

function folderToSlug(folder: string): string {
  return folder.toLowerCase().replace(/\s+/g, "-");
}

function buildProjectsFromSeed(): ProjectWithProgress[] {
  return seedProjects.map((p) => {
    const milestones = seedMilestones.filter((m) => m.project_id === p.id);
    const done = milestones.filter((m) => m.status === "Done").length;
    const total = milestones.length;
    return {
      id: p.id,
      name: p.name,
      slug: folderToSlug(p.folder),
      folder: p.folder,
      domain: p.domain,
      status: p.status,
      priority: p.priority,
      notes: p.notes,
      totalMilestones: total,
      doneMilestones: done,
      progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });
}

function buildProjectDetailFromSeed(slug: string): ProjectDetail | null {
  const project = seedProjects.find((p) => folderToSlug(p.folder) === slug);
  if (!project) return null;

  const milestones = seedMilestones
    .filter((m) => m.project_id === project.id)
    .sort((a, b) => a.number - b.number)
    .map((m) => ({
      id: m.id,
      number: m.number,
      title: m.title,
      description: m.description,
      status: m.status,
      blocking: m.blocking,
      totalTasks: 0,
      doneTasks: 0,
    }));

  const done = milestones.filter((m) => m.status === "Done").length;
  const total = milestones.length;

  return {
    id: project.id,
    name: project.name,
    slug: folderToSlug(project.folder),
    folder: project.folder,
    domain: project.domain,
    status: project.status,
    priority: project.priority,
    notes: project.notes,
    totalMilestones: total,
    doneMilestones: done,
    progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
    milestones,
  };
}

export async function getAllProjects(): Promise<ProjectWithProgress[]> {
  if (!isSupabaseConfigured) {
    return buildProjectsFromSeed();
  }

  const supabase = getSupabaseClient()!;
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .order("priority", { ascending: true });

  if (projectsError || !projects) {
    console.warn("Supabase projects fetch failed, using seed data:", projectsError?.message);
    return buildProjectsFromSeed();
  }

  const { data: milestones, error: milestonesError } = await supabase
    .from("milestones")
    .select("id, project_id, status");

  if (milestonesError || !milestones) {
    console.warn("Supabase milestones fetch failed, using seed data:", milestonesError?.message);
    return buildProjectsFromSeed();
  }

  return projects.map((p: any) => {
    const pMilestones = milestones.filter((m: any) => m.project_id === p.id);
    const done = pMilestones.filter((m: any) => m.status === "Done").length;
    const total = pMilestones.length;
    return {
      id: p.id,
      name: p.name,
      slug: folderToSlug(p.folder),
      folder: p.folder,
      domain: p.domain,
      status: p.status,
      priority: p.priority,
      notes: p.notes,
      totalMilestones: total,
      doneMilestones: done,
      progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  if (!isSupabaseConfigured) {
    return buildProjectDetailFromSeed(slug);
  }

  const supabase = getSupabaseClient()!;
  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .order("priority", { ascending: true });

  if (projectError || !projects) {
    console.warn("Supabase project fetch failed, using seed data:", projectError?.message);
    return buildProjectDetailFromSeed(slug);
  }

  const project = projects.find((p: any) => folderToSlug(p.folder) === slug);
  if (!project) return null;

  const { data: milestones, error: milestonesError } = await supabase
    .from("milestones")
    .select("*")
    .eq("project_id", project.id)
    .order("number", { ascending: true });

  if (milestonesError || !milestones) {
    console.warn("Supabase milestones fetch failed, using seed data:", milestonesError?.message);
    return buildProjectDetailFromSeed(slug);
  }

  // Fetch task counts per milestone
  const milestoneIds = milestones.map((m: any) => m.id);
  let taskCounts: Record<number, { total: number; done: number }> = {};

  if (milestoneIds.length > 0) {
    const { data: tasks } = await supabase
      .from("milestone_tasks")
      .select("milestone_id, done")
      .in("milestone_id", milestoneIds);

    if (tasks) {
      for (const task of tasks as any[]) {
        if (!taskCounts[task.milestone_id]) {
          taskCounts[task.milestone_id] = { total: 0, done: 0 };
        }
        taskCounts[task.milestone_id].total++;
        if (task.done) taskCounts[task.milestone_id].done++;
      }
    }
  }

  const milestonesDetail: MilestoneDetail[] = milestones.map((m: any) => ({
    id: m.id,
    number: m.number,
    title: m.title,
    description: m.description,
    status: m.status,
    blocking: m.blocking,
    totalTasks: taskCounts[m.id]?.total ?? 0,
    doneTasks: taskCounts[m.id]?.done ?? 0,
  }));

  const done = milestonesDetail.filter((m) => m.status === "Done").length;
  const total = milestonesDetail.length;

  return {
    id: project.id,
    name: project.name,
    slug: folderToSlug(project.folder),
    folder: project.folder,
    domain: project.domain,
    status: project.status,
    priority: project.priority,
    notes: project.notes,
    totalMilestones: total,
    doneMilestones: done,
    progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
    milestones: milestonesDetail,
  };
}

export async function getFeaturedProjects(): Promise<ProjectWithProgress[]> {
  if (!isSupabaseConfigured) {
    return buildProjectsFromSeed().filter((p) => p.priority <= 3);
  }

  const supabase = getSupabaseClient()!;
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .eq("featured", true)
    .order("priority", { ascending: true });

  if (projectsError || !projects || projects.length === 0) {
    // Fallback: use seed data filtered by priority
    return buildProjectsFromSeed().filter((p) => p.priority <= 3);
  }

  const { data: milestones } = await supabase
    .from("milestones")
    .select("id, project_id, status");

  return projects.map((p: any) => {
    const pMilestones = (milestones ?? []).filter((m: any) => m.project_id === p.id);
    const done = pMilestones.filter((m: any) => m.status === "Done").length;
    const total = pMilestones.length;
    return {
      id: p.id,
      name: p.name,
      slug: folderToSlug(p.folder),
      folder: p.folder,
      domain: p.domain,
      status: p.status,
      priority: p.priority,
      notes: p.notes,
      totalMilestones: total,
      doneMilestones: done,
      progressPercent: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });
}

export async function getAllProjectSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured) {
    return seedProjects.map((p) => folderToSlug(p.folder));
  }

  const supabase = getSupabaseClient()!;
  const { data, error } = await supabase.from("projects").select("folder");

  if (error || !data) {
    return seedProjects.map((p) => folderToSlug(p.folder));
  }

  return data.map((p: any) => folderToSlug(p.folder));
}
