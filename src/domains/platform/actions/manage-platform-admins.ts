"use server";

import { createSupabaseAdmin } from "@/lib/supabase/supabase-admin";
import { assertPlatformAdmin } from "@/lib/platform/assert-platform-admin";

/**
 * Add a user as a platform_admin.
 * Restricted to platform_owner only.
 * Cannot add yourself (no self-escalation).
 * Cannot grant platform_owner role — only platform_admin.
 * The target user must already exist in auth.users.
 */
export async function addPlatformAdmin(targetEmail: string): Promise<void> {
  const caller = await assertPlatformAdmin();

  if (caller.role !== "platform_owner") {
    throw new Error("Only the platform owner can add platform admins.");
  }

  const db = createSupabaseAdmin() as any;

  // Resolve target email → auth user
  const { data: usersData, error: listError } = await db.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  });
  if (listError) throw new Error(`Could not look up users: ${listError.message}`);

  const authUsers = (usersData?.users ?? []) as Array<{ id: string; email?: string }>;
  const target = authUsers.find(
    (u) => (u.email ?? "").toLowerCase() === targetEmail.trim().toLowerCase()
  );

  if (!target) {
    throw new Error(`No user found with email: ${targetEmail}`);
  }

  if (target.id === caller.userId) {
    throw new Error("You cannot add yourself as a platform admin.");
  }

  // Check target is not already a platform admin
  const { data: existing } = await db
    .from("platform_admins")
    .select("role")
    .eq("user_id", target.id)
    .maybeSingle();

  if (existing) {
    throw new Error(
      `${targetEmail} is already a platform admin (role: ${existing.role}).`
    );
  }

  const { error: insertError } = await db.from("platform_admins").insert({
    user_id: target.id,
    role: "platform_admin",
    created_by: caller.userId,
  });

  if (insertError) throw new Error(`Failed to add platform admin: ${insertError.message}`);
}

/**
 * Remove a platform_admin.
 * Restricted to platform_owner only.
 * Cannot remove yourself.
 * Cannot remove another platform_owner.
 */
export async function removePlatformAdmin(targetUserId: string): Promise<void> {
  const caller = await assertPlatformAdmin();

  if (caller.role !== "platform_owner") {
    throw new Error("Only the platform owner can remove platform admins.");
  }

  if (targetUserId === caller.userId) {
    throw new Error("You cannot remove yourself.");
  }

  const db = createSupabaseAdmin() as any;

  // Verify target exists and is not a platform_owner
  const { data: target } = await db
    .from("platform_admins")
    .select("role")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!target) {
    throw new Error("User is not a platform admin.");
  }

  if (target.role === "platform_owner") {
    throw new Error("Cannot remove a platform owner.");
  }

  const { error } = await db
    .from("platform_admins")
    .delete()
    .eq("user_id", targetUserId)
    .eq("role", "platform_admin");

  if (error) throw new Error(`Failed to remove platform admin: ${error.message}`);
}
