import { defineMiddleware } from "astro:middleware";
import { createSSRClient } from "./lib/supabase-server";

export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Set default locals
  context.locals.user = null;
  context.locals.org = null;
  context.locals.isMember = false;

  // 2. Skip auth resolution for static assets
  const { pathname } = context.url;
  if (pathname.startsWith("/_") || /\.\w+$/.test(pathname)) {
    return next();
  }

  // 3. Resolve session using @supabase/ssr
  const supabase = createSSRClient(context.request, context.cookies);

  const { data: { user: authUser } } = await supabase.auth.getUser();

  // 4. No user — continue as anonymous
  if (!authUser) {
    return next();
  }

  // 5. Authenticated user
  context.locals.user = {
    id: authUser.id,
    email: authUser.email ?? "",
    name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? "",
    avatarUrl: authUser.user_metadata?.avatar_url ?? "",
  };

  // 6–8. Resolve org membership (failure = read-only, don't crash)
  try {
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id, role, organizations(id, name, slug)")
      .eq("user_id", authUser.id)
      .limit(1)
      .single();

    if (membership?.organizations) {
      const org = membership.organizations as unknown as {
        id: string;
        name: string;
        slug: string;
      };
      context.locals.org = {
        orgId: org.id,
        orgName: org.name,
        orgSlug: org.slug,
        role: membership.role,
      };
      context.locals.isMember = true;
    }
  } catch {
    // No membership or query error — user stays read-only
  }

  // 9. Continue
  return next();
});
