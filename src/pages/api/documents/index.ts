import type { APIRoute } from "astro";
import { createUserClient } from "../../../lib/supabase-server";

export const prerender = false;

const MAX_CONTENT_SIZE = 1_000_000; // 1 MB

// GET — list documents (filterable by scope, project_id, doc_type)
export const GET: APIRoute = async ({ locals, cookies, url }) => {
  if (!locals.isMember || !locals.org) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) return new Response(JSON.stringify({ error: "No session" }), { status: 401 });

  const supabase = createUserClient(accessToken);
  let query = supabase
    .from("documents")
    .select("id, slug, title, scope, doc_type, project_id, updated_at")
    .eq("org_id", locals.org.orgId)
    .order("updated_at", { ascending: false });

  const scope = url.searchParams.get("scope");
  if (scope) query = query.eq("scope", scope);

  const projectId = url.searchParams.get("project_id");
  if (projectId) query = query.eq("project_id", Number(projectId));

  const docType = url.searchParams.get("doc_type");
  if (docType) query = query.eq("doc_type", docType);

  const { data, error } = await query;
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};

// POST — create document
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  if (!locals.isMember || !locals.org) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const accessToken = cookies.get("sb-access-token")?.value;
  if (!accessToken) return new Response(JSON.stringify({ error: "No session" }), { status: 401 });

  const body = await request.json();
  const { slug, title, content, scope, project_id, doc_type } = body;

  // Validate required fields
  if (!title || typeof title !== "string") {
    return new Response(JSON.stringify({ error: "title is required" }), { status: 400 });
  }
  if (!slug || typeof slug !== "string") {
    return new Response(JSON.stringify({ error: "slug is required" }), { status: 400 });
  }
  if (!scope || !["global", "project"].includes(scope)) {
    return new Response(JSON.stringify({ error: "scope must be 'global' or 'project'" }), { status: 400 });
  }
  if (!doc_type || typeof doc_type !== "string") {
    return new Response(JSON.stringify({ error: "doc_type is required" }), { status: 400 });
  }

  // Enforce content size limit
  if (content && typeof content === "string" && content.length > MAX_CONTENT_SIZE) {
    return new Response(JSON.stringify({ error: "Content exceeds 1 MB limit" }), { status: 413 });
  }

  const supabase = createUserClient(accessToken);
  const { data, error } = await supabase
    .from("documents")
    .insert({
      slug,
      title,
      content: content || "",
      scope,
      project_id: project_id ?? null,
      doc_type,
      org_id: locals.org.orgId,
    })
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 201, headers: { "Content-Type": "application/json" } });
};
