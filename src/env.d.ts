/// <reference types="astro/client" />

interface OrgMembership {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: string;
}

interface AuthLocals {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
  } | null;
  org: OrgMembership | null;
  isMember: boolean;
}

declare namespace App {
  interface Locals extends AuthLocals {}
}
