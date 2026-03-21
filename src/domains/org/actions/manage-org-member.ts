"use server";

import { createSupabaseAdmin } from "@/lib/supabase/supabase-admin";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { OrgRole } from "./get-org-members";

// ── Helper: assert caller is owner or admin of the org ──────────
async function assertOrgManager(): Promise<{ orgId: string; callerId: string; callerRole: OrgRole }> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) throw new Error("คุณไม่ได้อยู่ในองค์กรใด");
  if (!["owner", "admin"].includes(membership.role)) {
    throw new Error("คุณต้องมีสิทธิ์ Owner หรือ Admin เพื่อจัดการสมาชิก");
  }

  return { orgId: membership.organization_id, callerId: user.id, callerRole: membership.role as OrgRole };
}

// ── Add existing user to org by email ───────────────────────────
export async function addOrgMemberByEmail(
  email: string,
  role: OrgRole = "member"
): Promise<void> {
  const { orgId } = await assertOrgManager();

  if (role === "owner") throw new Error("ไม่สามารถเพิ่ม Owner ได้");

  const db = createSupabaseAdmin() as any;

  // Find user by email in auth
  const { data: authData } = await db.auth.admin.listUsers({ perPage: 1000 });
  const targetUser = (authData?.users || []).find(
    (u: any) => u.email?.toLowerCase() === email.toLowerCase().trim()
  );
  if (!targetUser) throw new Error("ไม่พบผู้ใช้งานที่มีอีเมลนี้ในระบบ");

  // Check not already in any org
  const { data: existing } = await db
    .from("organization_members")
    .select("organization_id, organizations(name)")
    .eq("user_id", targetUser.id)
    .maybeSingle();

  if (existing) {
    const orgName = (existing.organizations as any)?.name ?? "องค์กรอื่น";
    if (existing.organization_id === orgId) {
      throw new Error("ผู้ใช้งานนี้เป็นสมาชิกขององค์กรนี้อยู่แล้ว");
    }
    throw new Error(`ผู้ใช้งานนี้เป็นสมาชิกของ "${orgName}" อยู่แล้ว`);
  }

  const { error } = await db.from("organization_members").insert({
    organization_id: orgId,
    user_id: targetUser.id,
    role,
  });
  if (error) throw new Error(error.message);
}

// ── Update member role ───────────────────────────────────────────
export async function updateOrgMemberRole(
  targetUserId: string,
  newRole: OrgRole
): Promise<void> {
  const { orgId, callerId, callerRole } = await assertOrgManager();

  if (newRole === "owner") throw new Error("ไม่สามารถตั้งบทบาทเป็น Owner ได้");
  if (targetUserId === callerId) throw new Error("ไม่สามารถเปลี่ยนบทบาทของตัวเองได้");

  // Only owner can change admin's role
  const db = createSupabaseAdmin() as any;
  const { data: target } = await db
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!target) throw new Error("ไม่พบสมาชิกในองค์กรนี้");
  if (target.role === "owner") throw new Error("ไม่สามารถเปลี่ยนบทบาทของ Owner ได้");
  if (target.role === "admin" && callerRole !== "owner") {
    throw new Error("เฉพาะ Owner เท่านั้นที่เปลี่ยนบทบาทของ Admin ได้");
  }

  const { error } = await db
    .from("organization_members")
    .update({ role: newRole })
    .eq("organization_id", orgId)
    .eq("user_id", targetUserId);

  if (error) throw new Error(error.message);
}

// ── Remove member from org ───────────────────────────────────────
export async function removeOrgMember(targetUserId: string): Promise<void> {
  const { orgId, callerId, callerRole } = await assertOrgManager();

  if (targetUserId === callerId) throw new Error("ไม่สามารถลบตัวเองออกจากองค์กรได้");

  const db = createSupabaseAdmin() as any;
  const { data: target } = await db
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!target) throw new Error("ไม่พบสมาชิกในองค์กรนี้");
  if (target.role === "owner") throw new Error("ไม่สามารถลบ Owner ออกจากองค์กรได้");
  if (target.role === "admin" && callerRole !== "owner") {
    throw new Error("เฉพาะ Owner เท่านั้นที่ลบ Admin ได้");
  }

  const { error } = await db
    .from("organization_members")
    .delete()
    .eq("organization_id", orgId)
    .eq("user_id", targetUserId);

  if (error) throw new Error(error.message);
}
