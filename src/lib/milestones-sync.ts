/**
 * Sync utility for bidirectional MILESTONES.md ↔ Supabase synchronization.
 *
 * - importFromMarkdown(): parses a MILESTONES.md file and upserts into DB
 * - exportToMarkdown(): reads DB and produces MILESTONES.md content
 * - getProjects() / getMilestones(): query helpers with seed-data fallback
 *
 * When Supabase is not configured, all read functions fall back to local seed data.
 */

import { getSupabaseClient } from "./supabase";
import { seedProjects, seedMilestones, type SeedProject, type SeedMilestone } from "./seed-data";
import type { MilestoneStatus } from "./database.types";

// ----- Query helpers (with fallback) -----

export async function getProjects(): Promise<SeedProject[]> {
  const client = getSupabaseClient();
  if (!client) return seedProjects;

  const { data, error } = await client
    .from("projects")
    .select("*")
    .order("priority", { ascending: true });

  if (error || !data) return seedProjects;
  return data as SeedProject[];
}

export async function getMilestones(projectId?: number): Promise<SeedMilestone[]> {
  const client = getSupabaseClient();
  if (!client) {
    return projectId
      ? seedMilestones.filter((m) => m.project_id === projectId)
      : seedMilestones;
  }

  let query = client
    .from("milestones")
    .select("*")
    .order("project_id", { ascending: true })
    .order("number", { ascending: true });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error || !data) {
    return projectId
      ? seedMilestones.filter((m) => m.project_id === projectId)
      : seedMilestones;
  }
  return data as SeedMilestone[];
}

export async function getNextPlannedMilestone(): Promise<{
  project: SeedProject;
  milestone: SeedMilestone;
} | null> {
  const projects = await getProjects();
  const milestones = await getMilestones();

  for (const project of projects) {
    const planned = milestones.find(
      (m) => m.project_id === project.id && m.status === "Planned"
    );
    if (planned) {
      return { project, milestone: planned };
    }
  }
  return null;
}

// ----- Markdown parser -----

interface ParsedMilestone {
  number: number;
  title: string;
  description: string;
  status: MilestoneStatus;
  blocking: string | null;
  tasks: { description: string; done: boolean }[];
}

interface ParsedTracker {
  milestone: string;
  status: MilestoneStatus;
  blocking: string;
}

export function parseMarkdownMilestones(markdown: string): {
  milestones: ParsedMilestone[];
  tracker: ParsedTracker[];
} {
  const milestones: ParsedMilestone[] = [];
  const tracker: ParsedTracker[] = [];

  // Parse milestone sections
  const milestoneRegex = /^## M(\d+)\s*—\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  const sections: { number: number; title: string; start: number }[] = [];

  while ((match = milestoneRegex.exec(markdown)) !== null) {
    sections.push({
      number: parseInt(match[1], 10),
      title: match[2].trim(),
      start: match.index,
    });
  }

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const end = i + 1 < sections.length ? sections[i + 1].start : markdown.length;
    const content = markdown.slice(section.start, end);

    // Extract description (first paragraph after heading, before ### Tasks)
    const descMatch = content.match(/^## .+\n\n(.+?)(?:\n\n|$)/s);
    const description = descMatch ? descMatch[1].trim() : "";

    // Extract tasks
    const tasks: { description: string; done: boolean }[] = [];
    const taskRegex = /^- \[([ x])\] (.+)$/gm;
    let taskMatch: RegExpExecArray | null;
    while ((taskMatch = taskRegex.exec(content)) !== null) {
      tasks.push({
        done: taskMatch[1] === "x",
        description: taskMatch[2].trim(),
      });
    }

    // Determine status from tasks
    let status: MilestoneStatus = "Planned";
    if (tasks.length > 0) {
      const allDone = tasks.every((t) => t.done);
      const someDone = tasks.some((t) => t.done);
      if (allDone) status = "Done";
      else if (someDone) status = "In Progress";
    }

    milestones.push({
      number: section.number,
      title: section.title,
      description,
      status,
      blocking: null, // Will be filled from tracker
      tasks,
    });
  }

  // Parse tracker table
  const trackerRegex = /\| M(\d+)\s*—\s*(.+?)\s*\|\s*(Done|Planned|In Progress|Blocked)\s*\|\s*(.+?)\s*\|/g;
  let trackerMatch: RegExpExecArray | null;
  while ((trackerMatch = trackerRegex.exec(markdown)) !== null) {
    const num = parseInt(trackerMatch[1], 10);
    const trackerStatus = trackerMatch[3] as MilestoneStatus;
    const blocking = trackerMatch[4].trim();

    tracker.push({
      milestone: `M${num}`,
      status: trackerStatus,
      blocking: blocking === "—" ? "" : blocking,
    });

    // Update milestone status from tracker (tracker is authoritative)
    const ms = milestones.find((m) => m.number === num);
    if (ms) {
      ms.status = trackerStatus;
      ms.blocking = blocking === "—" ? null : blocking;
    }
  }

  return { milestones, tracker };
}

// ----- Import: MILESTONES.md → DB -----

export async function importFromMarkdown(
  projectFolder: string,
  markdown: string
): Promise<{ imported: number; errors: string[] }> {
  const client = getSupabaseClient();
  if (!client) {
    return { imported: 0, errors: ["Supabase not configured"] };
  }

  const { milestones } = parseMarkdownMilestones(markdown);
  const errors: string[] = [];
  let imported = 0;

  // Find or create project
  const { data: project } = await client
    .from("projects")
    .select("id")
    .eq("folder", projectFolder)
    .single();

  if (!project) {
    errors.push(`Project with folder "${projectFolder}" not found in DB`);
    return { imported, errors };
  }

  for (const ms of milestones) {
    // Upsert milestone
    const { data: existing } = await client
      .from("milestones")
      .select("id")
      .eq("project_id", project.id)
      .eq("number", ms.number)
      .single();

    let milestoneId: number;

    if (existing) {
      const { error } = await client
        .from("milestones")
        .update({
          title: ms.title,
          description: ms.description,
          status: ms.status,
          blocking: ms.blocking,
          completed_at: ms.status === "Done" ? new Date().toISOString() : null,
        })
        .eq("id", existing.id);

      if (error) {
        errors.push(`Failed to update M${ms.number}: ${error.message}`);
        continue;
      }
      milestoneId = existing.id;
    } else {
      const { data: inserted, error } = await client
        .from("milestones")
        .insert({
          project_id: project.id,
          number: ms.number,
          title: ms.title,
          description: ms.description,
          status: ms.status,
          blocking: ms.blocking,
          completed_at: ms.status === "Done" ? new Date().toISOString() : null,
        })
        .select("id")
        .single();

      if (error || !inserted) {
        errors.push(`Failed to insert M${ms.number}: ${error?.message}`);
        continue;
      }
      milestoneId = inserted.id;
    }

    // Replace tasks
    await client.from("milestone_tasks").delete().eq("milestone_id", milestoneId);
    if (ms.tasks.length > 0) {
      const { error } = await client.from("milestone_tasks").insert(
        ms.tasks.map((t) => ({
          milestone_id: milestoneId,
          description: t.description,
          done: t.done,
        }))
      );
      if (error) {
        errors.push(`Failed to insert tasks for M${ms.number}: ${error.message}`);
      }
    }

    imported++;
  }

  return { imported, errors };
}

// ----- Export: DB → MILESTONES.md -----

export async function exportToMarkdown(projectFolder: string): Promise<string> {
  const projects = await getProjects();
  const project = projects.find((p) => p.folder === projectFolder);
  if (!project) return `# Error: project "${projectFolder}" not found`;

  const milestones = await getMilestones(project.id);

  // Fetch tasks per milestone
  const client = getSupabaseClient();
  const tasksByMilestone = new Map<number, { description: string; done: boolean }[]>();

  if (client) {
    for (const ms of milestones) {
      const { data } = await client
        .from("milestone_tasks")
        .select("description, done")
        .eq("milestone_id", ms.id)
        .order("id", { ascending: true });
      if (data) tasksByMilestone.set(ms.id, data);
    }
  }

  // Build markdown
  const lines: string[] = [];
  lines.push(`# ${project.name} — Milestones\n`);

  for (const ms of milestones) {
    lines.push(`---\n`);
    lines.push(`## M${ms.number} — ${ms.title}\n`);
    if (ms.description) lines.push(`${ms.description}\n`);

    const tasks = tasksByMilestone.get(ms.id) ?? [];
    if (tasks.length > 0) {
      lines.push(`### Tasks\n`);
      for (const t of tasks) {
        lines.push(`- [${t.done ? "x" : " "}] ${t.description}`);
      }
      lines.push("");
    }
  }

  // Tracker table
  lines.push(`---\n`);
  lines.push(`## Tracker\n`);
  lines.push(`| Milestone | Status | Blocking |`);
  lines.push(`|-----------|--------|----------|`);
  for (const ms of milestones) {
    lines.push(
      `| M${ms.number} — ${ms.title} | ${ms.status} | ${ms.blocking ?? "—"} |`
    );
  }
  lines.push("");
  lines.push(`---\n`);
  lines.push(`_Last updated: ${new Date().toISOString().split("T")[0]}_`);

  return lines.join("\n");
}
