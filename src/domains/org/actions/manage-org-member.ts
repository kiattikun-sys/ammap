"use server";

import { createSupabaseAdmin } from "@/lib/supabase/supabase-admin";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { OrgRole } from "./get-org-members";

type ActionResult = { ok: true } | { ok: false; error: string };

// ── Helper: assert caller is owner or admin of the org ──────────
async function assertOrgManager(): Promise<
  | { ok: true; orgId: string; callerId: string; callerRole: OrgRole }
  | { ok: false; error: string }
> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return { ok: false, error: "คุณไม่ได้อยู่ในองค์กรใด" };
  if (!["owner", "admin"].includes(membership.role)) {
    return { ok: false, error: "คุณต้องมีสิทธิ์ Owner หรือ Admin เพื่อจัดการสมาชิก" };
  }

  return {
    ok: true,
    orgId: membership.organization_id,
    callerId: user.id,
    callerRole: membership.role as OrgRole,
  };
}

// ── Add existing user to org by email ───────────────────────────
export async function addOrgMemberByEmail(
  email: string,
  role: OrgRole = "member"
): Promise<ActionResult> {
  const guard = await assertOrgManager();
  if (!guard.ok) return guard;
  const { orgId } = guard;

  if (role === "owner") return { ok: false, error: "ไม่สามารถเพิ่ม Owner ได้" };

  const db = createSupabaseAdmin() as any;

  // Find user by email in auth
  const { data: authData, error: listErr } = await db.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listErr) return { ok: false, error: "ไม่สามารถค้นหาผู้ใช้งานได้" };

  const targetUser = (authData?.users || []).find(
    (u: any) => u.email?.toLowerCase() === email.toLowerCase().trim()
  );
  if (!targetUser)
    return { ok: false, error: "ไม่พบผู้ใช้งานที่มีอีเมลนี้ในระบบ กรุณาให้ผู้ใช้สมัครก่อน" };

  // Check not already in an org
  const { data: existing } = await db
    .from("organization_members")
    .select("organization_id, organizations(name)")
    .eq("user_id", targetUser.id)
    .maybeSingle();

  if (existing) {
    const orgName = (existing.organizations as any)?.name ?? "องค์กรอื่น";
    if (existing.organization_id === orgId)
      return { ok: false, error: "ผู้ใช้งานนี้เป็นสมาชิกขององค์กรนี้อยู่แล้ว" };
    return { ok: false, error: `ผู้ใช้งานนี้เป็นสมาชิกของ "${orgName}" อยู่แล้ว` };
  }

  const { error } = await db.from("organization_members").insert({
    organization_id: orgId,
    user_id: targetUser.id,
    role,
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

// ── Update member role ───────────────────────────────────────────
export async function updateOrgMemberRole(
  targetUserId: string,
  newRole: OrgRole
): Promise<ActionResult> {
  const guard = await assertOrgManager();
  if (!guard.ok) return guard;
  const { orgId, callerId, callerRole } = guard;

  if (newRole === "owner") return { ok: false, error: "ไม่สามารถตั้งบทบาทเป็น Owner ได้" };
  if (targetUserId === callerId) return { ok: false, error: "ไม่สามารถเปลี่ยนบทบาทของตัวเองได้" };

  const db = createSupabaseAdmin() as any;
  const { data: target } = await db
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!target) return { ok: false, error: "ไม่พบสมาชิกในองค์กรนี้" };
  if (target.role === "owner") return { ok: false, error: "ไม่สามารถเปลี่ยนบทบาทของ Owner ได้" };
  if (target.role === "admin" && callerRole !== "owner") {
    return { ok: false, error: "เฉพาะ Owner เท่านั้นที่เปลี่ยนบทบาทของ Admin ได้" };
  }

  const { error } = await db
    .from("organization_members")
    .update({ role: newRole })
    .eq("organization_id", orgId)
    .eq("user_id", targetUserId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── Remove member from org ───────────────────────────────────────
export async function removeOrgMember(targetUserId: string): Promise<ActionResult> {
  const guard = await assertOrgManager();
  if (!guard.ok) return guard;
  const { orgId, callerId, callerRole } = guard;

  if (targetUserId === callerId) return { ok: false, error: "ไม่สามารถลบตัวเองออกจากองค์กรได้" };

  const db = createSupabaseAdmin() as any;
  const { data: target } = await db
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (!target) return { ok: false, error: "ไม่พบสมาชิกในองค์กรนี้" };
  if (target.role === "owner") return { ok: false, error: "ไม่สามารถลบ Owner ออกจากองค์กรได้" };
  if (target.role === "admin" && callerRole !== "owner") {
    return { ok: false, error: "เฉพาะ Owner เท่านั้นที่ลบ Admin ได้" };
  }

  const { error } = await db
    .from("organization_members")
    .delete()
    .eq("organization_id", orgId)
    .eq("user_id", targetUserId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
