"use server";

import { createSupabaseAdmin } from "@/lib/supabase/supabase-admin";
import { assertPlatformAdmin } from "@/lib/platform/assert-platform-admin";

export interface PlatformOrgMember {
  userId: string;
  displayName: string | null;
  email: string;
  role: string;
}

export interface PlatformOrganization {
  id: string;
  name: string;
  ownerId: string;
  ownerDisplayName: string | null;
  ownerEmail: string;
  memberCount: number;
  projectCount: number;
  archivedProjectCount: number;
  createdAt: string;
  members: PlatformOrgMember[];
}

export async function listPlatformOrganizations(): Promise<PlatformOrganization[]> {
  await assertPlatformAdmin();

  const db = createSupabaseAdmin() as any;

  // 1. Fetch all organizations
  const { data: orgs, error: orgsError } = await db
    .from("organizations")
    .select("id, name, owner_id, created_at")
    .order("created_at", { ascending: false });

  if (orgsError) throw new Error(`listPlatformOrganizations: ${orgsError.message}`);
  if (!orgs || orgs.length === 0) return [];

  const orgIds = (orgs as { id: string }[]).map((o) => o.id);

  // 2. Parallel: members (with profiles), projects, owner auth emails
  const [membersResult, projectsResult, profilesResult, authUsersResult] = await Promise.all([
    db
      .from("organization_members")
      .select("organization_id, user_id, role")
      .in("organization_id", orgIds),
    db
      .from("projects")
      .select("id, organization_id, archived_at")
      .in("organization_id", orgIds),
    db
      .from("profiles")
      .select("id, display_name"),
    // Fetch auth users for email lookup — limited to owner IDs to keep it tight
    db.auth.admin.listUsers({ perPage: 1000, page: 1 }),
  ]);

  // Build profile display name map (all users)
  const profileMap = new Map<string, string | null>(
    (profilesResult.data ?? []).map(
      (p: { id: string; display_name: string | null }) => [p.id, p.display_name]
    )
  );

  // Build auth email map (all auth users)
  const emailMap = new Map<string, string>(
    ((authUsersResult.data?.users ?? []) as Array<{ id: string; email?: string }>).map(
      (u) => [u.id, u.email ?? ""]
    )
  );

  // Group members by org
  type MemberRow = { organization_id: string; user_id: string; role: string };
  const membersByOrg = new Map<string, MemberRow[]>();
  for (const m of membersResult.data ?? []) {
    const row = m as MemberRow;
    if (!membersByOrg.has(row.organization_id)) membersByOrg.set(row.organization_id, []);
    membersByOrg.get(row.organization_id)!.push(row);
  }

  // Group projects by org
  type ProjectRow = { id: string; organization_id: string; archived_at: string | null };
  const projectsByOrg = new Map<string, ProjectRow[]>();
  for (const p of projectsResult.data ?? []) {
    const row = p as ProjectRow;
    if (!projectsByOrg.has(row.organization_id)) projectsByOrg.set(row.organization_id, []);
    projectsByOrg.get(row.organization_id)!.push(row);
  }

  return (orgs as { id: string; name: string; owner_id: string; created_at: string }[]).map(
    (org) => {
      const members = membersByOrg.get(org.id) ?? [];
      const projects = projectsByOrg.get(org.id) ?? [];
      const archivedCount = projects.filter((p) => p.archived_at !== null).length;

      const memberDetails: PlatformOrgMember[] = members.map((m) => ({
        userId: m.user_id,
        displayName: profileMap.get(m.user_id) ?? null,
        email: emailMap.get(m.user_id) ?? "",
        role: m.role,
      }));

      return {
        id: org.id,
        name: org.name,
        ownerId: org.owner_id,
        ownerDisplayName: profileMap.get(org.owner_id) ?? null,
        ownerEmail: emailMap.get(org.owner_id) ?? "",
        memberCount: members.length,
        projectCount: projects.length - archivedCount,
        archivedProjectCount: archivedCount,
        createdAt: org.created_at,
        members: memberDetails,
      };
    }
  );
}
