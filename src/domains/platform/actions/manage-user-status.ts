"use server";

import { createSupabaseAdmin } from "@/lib/supabase/supabase-admin";
import { assertPlatformAdmin } from "@/lib/platform/assert-platform-admin";

// ── Permission matrix ─────────────────────────────────────────────
//
// platform_owner  → can suspend/reactivate any user except:
//                   - themselves
//                   - other platform_owners (owner continuity)
//
// platform_admin  → can suspend/reactivate regular users only:
//                   - cannot touch platform_owners
//                   - cannot touch other platform_admins
//
// Both:           → cannot suspend the last active platform_owner
// ─────────────────────────────────────────────────────────────────

async function getTargetPlatformRole(
  db: any,
  targetUserId: string
): Promise<"platform_owner" | "platform_admin" | null> {
  const { data } = await db
    .from("platform_admins")
    .select("role")
    .eq("user_id", targetUserId)
    .maybeSingle();
  return data?.role ?? null;
}

async function countActivePlatformOwners(db: any): Promise<number> {
  // Count platform_owners whose profile is active
  const { data } = await db
    .from("platform_admins")
    .select("user_id")
    .eq("role", "platform_owner");

  if (!data || data.length === 0) return 0;

  const ownerIds = (data as { user_id: string }[]).map((r) => r.user_id);
  const { count } = await db
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .in("id", ownerIds)
    .eq("status", "active");

  return count ?? 0;
}

export async function suspendUser(
  targetUserId: string,
  reason?: string
): Promise<void> {
  const caller = await assertPlatformAdmin();
  const db = createSupabaseAdmin() as any;

  // Cannot suspend yourself
  if (targetUserId === caller.userId) {
    throw new Error("You cannot suspend yourself.");
  }

  // Check target's platform role
  const targetPlatformRole = await getTargetPlatformRole(db, targetUserId);

  if (targetPlatformRole === "platform_owner") {
    throw new Error("Cannot suspend a platform owner.");
  }

  if (targetPlatformRole === "platform_admin" && caller.role !== "platform_owner") {
    throw new Error(
      "Only the platform owner can suspend platform admins."
    );
  }

  // Verify target profile exists
  const { data: profile } = await db
    .from("profiles")
    .select("id, status")
    .eq("id", targetUserId)
    .maybeSingle();

  if (!profile) {
    throw new Error("User profile not found.");
  }

  if (profile.status === "suspended") {
    throw new Error("User is already suspended.");
  }

  const now = new Date().toISOString();

  const { error } = await db
    .from("profiles")
    .update({
      status: "suspended",
      suspended_at: now,
      suspended_by: caller.userId,
      suspension_reason: reason?.trim() || null,
      updated_at: now,
    })
    .eq("id", targetUserId);

  if (error) throw new Error(`Failed to suspend user: ${error.message}`);
}

export async function reactivateUser(targetUserId: string): Promise<void> {
  const caller = await assertPlatformAdmin();
  const db = createSupabaseAdmin() as any;

  // Cannot reactivate yourself via this path (edge case — your own suspension
  // would have already blocked your access)
  if (targetUserId === caller.userId) {
    throw new Error("Cannot self-reactivate. Contact another platform owner.");
  }

  const targetPlatformRole = await getTargetPlatformRole(db, targetUserId);

  if (targetPlatformRole === "platform_owner") {
    throw new Error("Cannot modify a platform owner's status via this action.");
  }

  if (targetPlatformRole === "platform_admin" && caller.role !== "platform_owner") {
    throw new Error(
      "Only the platform owner can reactivate platform admins."
    );
  }

  const { data: profile } = await db
    .from("profiles")
    .select("id, status")
    .eq("id", targetUserId)
    .maybeSingle();

  if (!profile) {
    throw new Error("User profile not found.");
  }

  if (profile.status === "active") {
    throw new Error("User is already active.");
  }

  const now = new Date().toISOString();

  const { error } = await db
    .from("profiles")
    .update({
      status: "active",
      reactivated_at: now,
      reactivated_by: caller.userId,
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null,
      updated_at: now,
    })
    .eq("id", targetUserId);

  if (error) throw new Error(`Failed to reactivate user: ${error.message}`);
}
