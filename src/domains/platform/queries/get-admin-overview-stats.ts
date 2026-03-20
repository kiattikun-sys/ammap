"use server";

import { createSupabaseAdmin } from "@/lib/supabase/supabase-admin";
import { assertPlatformAdmin } from "@/lib/platform/assert-platform-admin";

export interface AdminOverviewStats {
  pendingRequests: number;
  totalUsers: number;
  totalOrganizations: number;
  invitedNotActivated: number;
  totalPlatformAdmins: number;
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  await assertPlatformAdmin();

  const db = createSupabaseAdmin() as any;

  const [
    pendingResult,
    invitedResult,
    orgsResult,
    adminsResult,
    usersResult,
  ] = await Promise.all([
    db
      .from("registration_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("registration_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["approved", "invited"]),
    db
      .from("organizations")
      .select("id", { count: "exact", head: true }),
    db
      .from("platform_admins")
      .select("id", { count: "exact", head: true }),
    db.auth.admin.listUsers({ perPage: 1 }),
  ]);

  const totalUsers: number =
    (usersResult.data as { total?: number } | null)?.total ?? 0;

  return {
    pendingRequests: pendingResult.count ?? 0,
    invitedNotActivated: invitedResult.count ?? 0,
    totalOrganizations: orgsResult.count ?? 0,
    totalPlatformAdmins: adminsResult.count ?? 0,
    totalUsers,
  };
}
