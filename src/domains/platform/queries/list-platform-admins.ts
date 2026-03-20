"use server";

import { createSupabaseAdmin } from "@/lib/supabase/supabase-admin";
import { assertPlatformAdmin } from "@/lib/platform/assert-platform-admin";

export interface PlatformAdminEntry {
  userId: string;
  role: "platform_owner" | "platform_admin";
  createdAt: string;
  createdBy: string | null;
  displayName: string | null;
  email: string;
}

export async function listPlatformAdmins(): Promise<PlatformAdminEntry[]> {
  await assertPlatformAdmin();

  const db = createSupabaseAdmin() as any;

  const { data: admins, error } = await db
    .from("platform_admins")
    .select("user_id, role, created_at, created_by")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`listPlatformAdmins: ${error.message}`);
  if (!admins || admins.length === 0) return [];

  const userIds = (admins as { user_id: string }[]).map((a) => a.user_id);

  const [profilesResult, authResult] = await Promise.all([
    db.from("profiles").select("id, display_name").in("id", userIds),
    db.auth.admin.listUsers({ perPage: 1000, page: 1 }),
  ]);

  const profileMap = new Map<string, string | null>(
    (profilesResult.data ?? []).map(
      (p: { id: string; display_name: string | null }) => [p.id, p.display_name]
    )
  );

  const emailMap = new Map<string, string>(
    ((authResult.data?.users ?? []) as Array<{ id: string; email?: string }>).map(
      (u) => [u.id, u.email ?? ""]
    )
  );

  return (
    admins as {
      user_id: string;
      role: "platform_owner" | "platform_admin";
      created_at: string;
      created_by: string | null;
    }[]
  ).map((a) => ({
    userId: a.user_id,
    role: a.role,
    createdAt: a.created_at,
    createdBy: a.created_by,
    displayName: profileMap.get(a.user_id) ?? null,
    email: emailMap.get(a.user_id) ?? "",
  }));
}
