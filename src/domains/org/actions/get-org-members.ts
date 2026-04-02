"use server";

import { createSupabaseAdmin } from "@/lib/supabase/supabase-admin";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export type OrgRole = "owner" | "admin" | "member" | "viewer";

export interface OrgMember {
  userId: string;
  displayName: string | null;
  email: string;
  role: OrgRole;
  joinedAt: string;
}

export interface OrgInfo {
  id: string;
  name: string;
  ownerId: string;
}

export interface GetOrgMembersResult {
  org: OrgInfo | null;
  members: OrgMember[];
  currentUserRole: OrgRole | null;
}

export async function getOrgMembers(): Promise<GetOrgMembersResult> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get current user's org membership
  const { data: myMembership } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(id, name, owner_id)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myMembership) return { org: null, members: [], currentUserRole: null };

  const orgId = myMembership.organization_id;
  const orgRaw = myMembership.organizations as any;
  const org: OrgInfo = {
    id: orgRaw.id,
    name: orgRaw.name,
    ownerId: orgRaw.owner_id,
  };

  // Get all members
  const { data: rows } = await supabase
    .from("organization_members")
    .select("user_id, role, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  if (!rows?.length) {
    return { org, members: [], currentUserRole: myMembership.role as OrgRole };
  }

  const userIds = rows.map((r) => r.user_id);

  // Fetch display names and emails via admin client
  const db = createSupabaseAdmin() as any;
  const [{ data: profiles }, { data: authData }] = await Promise.all([
    db.from("profiles").select("id, display_name").in("id", userIds),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const profileMap = new Map<string, string | null>(
    (profiles || []).map((p: any) => [p.id, p.display_name])
  );
  const emailMap = new Map<string, string>(
    (authData?.users || []).map((u: any) => [u.id, u.email])
  );

  const members: OrgMember[] = rows.map((r) => ({
    userId: r.user_id,
    displayName: profileMap.get(r.user_id) ?? null,
    email: emailMap.get(r.user_id) ?? "—",
    role: r.role as OrgRole,
    joinedAt: r.created_at,
  }));

  return {
    org,
    members,
    currentUserRole: myMembership.role as OrgRole,
  };
}
