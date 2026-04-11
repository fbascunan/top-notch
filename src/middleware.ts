import { defineMiddleware } from "astro:middleware";
import { getSessionFromCookies } from "./lib/auth";
import { createUserClient } from "./lib/supabase-server";

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

  // 3. Resolve session from cookies
  const { user, accessToken } = await getSessionFromCookies(context.cookies);

  // 4. No user — continue as anonymous
  if (!user || !accessToken) {
    return next();
  }

  // 5. Authenticated user
  context.locals.user = user;

  // 6–8. Resolve org membership (failure = read-only, don't crash)
  try {
    const supabase = createUserClient(accessToken);

    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id, role, organizations(id, name, slug)")
      .eq("user_id", user.id)
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
