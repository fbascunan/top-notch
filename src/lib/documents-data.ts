/**
 * Data fetching layer for documents.
 * Fetches from Supabase via anon client; returns empty array / null when unconfigured.
 */

import { getSupabaseClient, isSupabaseConfigured } from "./supabase";

export interface DocumentSummary {
  id: string;
  slug: string;
  title: string;
  scope: "global" | "project";
  doc_type: string;
  project_id: number | null;
  updated_at: string;
}

export interface DocumentFull extends DocumentSummary {
  content: string;
  org_id: string;
  created_at: string;
}

export async function getGlobalDocuments(): Promise<DocumentSummary[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabaseClient()!;
  const { data, error } = await supabase
    .from("documents")
    .select("id, slug, title, scope, doc_type, project_id, updated_at")
    .eq("scope", "global")
    .order("title", { ascending: true });
  if (error || !data) return [];
  return data as DocumentSummary[];
}

export async function getProjectDocuments(projectId: number): Promise<DocumentSummary[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabaseClient()!;
  const { data, error } = await supabase
    .from("documents")
    .select("id, slug, title, scope, doc_type, project_id, updated_at")
    .eq("scope", "project")
    .eq("project_id", projectId)
    .order("title", { ascending: true });
  if (error || !data) return [];
  return data as DocumentSummary[];
}

export async function getDocumentBySlug(slug: string): Promise<DocumentFull | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabaseClient()!;
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("slug", slug)
    .limit(1)
    .single();
  if (error || !data) return null;
  return data as DocumentFull;
}
