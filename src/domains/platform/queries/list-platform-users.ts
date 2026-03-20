"use server";

import { createSupabaseAdmin } from "@/lib/supabase/supabase-admin";
import { assertPlatformAdmin } from "@/lib/platform/assert-platform-admin";

export interface PlatformUserOrg {
  organizationId: string;
  organizationName: string;
  role: string;
}

export interface PlatformUser {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  platformRole: "platform_owner" | "platform_admin" | null;
  organizations: PlatformUserOrg[];
  registrationStatus: "pending" | "approved" | "invited" | "activated" | "rejected" | null;
  registrationRequestId: string | null;
  userStatus: "active" | "suspended";
  suspendedAt: string | null;
  suspensionReason: string | null;
}

export async function listPlatformUsers(): Promise<PlatformUser[]> {
  await assertPlatformAdmin();

  const db = createSupabaseAdmin() as any;

  // 1. Fetch all auth users (paginated — up to 1000 for v1)
  const { data: authData, error: authError } = await db.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  });
  if (authError) throw new Error(`listPlatformUsers: ${authError.message}`);

  const authUsers: Array<{
    id: string;
    email?: string;
    created_at: string;
    last_sign_in_at?: string;
  }> = authData?.users ?? [];

  if (authUsers.length === 0) return [];

  const userIds = authUsers.map((u) => u.id);

  // 2. Fetch profiles, platform_admins, org memberships + org names, registration requests
  const [profilesResult, platformAdminsResult, membershipsResult, requestsResult] =
    await Promise.all([
      db.from("profiles").select("id, display_name, status, suspended_at, suspension_reason").in("id", userIds),
      db.from("platform_admins").select("user_id, role").in("user_id", userIds),
      db
        .from("organization_members")
        .select("user_id, role, organization_id, organizations(id, name)")
        .in("user_id", userIds),
      db
        .from("registration_requests")
        .select("id, email, status")
        .in("status", ["pending", "approved", "invited", "activated", "rejected"]),
    ]);

  // Build lookup maps
  type ProfileRow = {
    id: string;
    display_name: string | null;
    status: "active" | "suspended";
    suspended_at: string | null;
    suspension_reason: string | null;
  };
  const profileDataMap = new Map<string, ProfileRow>(
    (profilesResult.data ?? []).map((p: ProfileRow) => [p.id, p])
  );
  const profileMap = new Map<string, string | null>(
    (profilesResult.data ?? []).map((p: ProfileRow) => [p.id, p.display_name])
  );

  const platformAdminMap = new Map<string, "platform_owner" | "platform_admin">(
    (platformAdminsResult.data ?? []).map(
      (a: { user_id: string; role: "platform_owner" | "platform_admin" }) => [a.user_id, a.role]
    )
  );

  const orgMap = new Map<string, PlatformUserOrg[]>();
  for (const m of membershipsResult.data ?? []) {
    const row = m as {
      user_id: string;
      role: string;
      organization_id: string;
      organizations: { id: string; name: string } | null;
    };
    if (!row.organizations) continue;
    if (!orgMap.has(row.user_id)) orgMap.set(row.user_id, []);
    orgMap.get(row.user_id)!.push({
      organizationId: row.organization_id,
      organizationName: row.organizations.name,
      role: row.role,
    });
  }

  // Match registration requests by email
  const requestByEmail = new Map<
    string,
    { id: string; status: string }
  >(
    (requestsResult.data ?? []).map(
      (r: { id: string; email: string; status: string }) => [r.email.toLowerCase(), r]
    )
  );

  return authUsers.map((u) => {
    const emailLower = (u.email ?? "").toLowerCase();
    const regRequest = requestByEmail.get(emailLower) ?? null;

    const profile = profileDataMap.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "",
      displayName: profileMap.get(u.id) ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
      platformRole: platformAdminMap.get(u.id) ?? null,
      organizations: orgMap.get(u.id) ?? [],
      registrationStatus: regRequest
        ? (regRequest.status as PlatformUser["registrationStatus"])
        : null,
      registrationRequestId: regRequest?.id ?? null,
      userStatus: (profile?.status ?? "active") as "active" | "suspended",
      suspendedAt: profile?.suspended_at ?? null,
      suspensionReason: profile?.suspension_reason ?? null,
    };
  });
}
