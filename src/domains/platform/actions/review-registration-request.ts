"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase/supabase-admin";

async function assertPlatformAdmin(db: any): Promise<string> {
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");

  const { data: admin } = await db
    .from("platform_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) throw new Error("Forbidden: platform admin access required");
  return user.id;
}

export async function approveRegistrationRequest(
  requestId: string,
  notes?: string
): Promise<void> {
  const db = (await createSupabaseServer()) as any;
  const reviewerId = await assertPlatformAdmin(db);

  // Fetch the request so we have email + org name for provisioning
  const { data: request, error: fetchError } = await db
    .from("registration_requests")
    .select("id, email, full_name, requested_org_name, status")
    .eq("id", requestId)
    .eq("status", "pending")
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!request) throw new Error("คำขอไม่พบ หรือได้รับการดำเนินการแล้ว");

  // 1. Mark approved FIRST so the trigger gate will find this row
  //    when the user accepts the invite and auth.users row is created.
  const { error: updateError } = await db
    .from("registration_requests")
    .update({
      status: "approved",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      notes: notes?.trim() || null,
    })
    .eq("id", requestId);

  if (updateError) throw new Error(updateError.message);

  // 2. Send invite via Admin API — creates a magic-link email to the user.
  //    When user clicks the link, auth.users INSERT fires handle_new_user()
  //    which now finds the approved row and creates the org + member.
  //    org_name is passed as user_metadata so trigger can use it.
  const adminClient = createSupabaseAdmin();
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    request.email,
    {
      data: {
        full_name: request.full_name,
        org_name: request.requested_org_name,
      },
    }
  );

  if (inviteError) {
    // Roll back status to pending so approver can retry
    await db
      .from("registration_requests")
      .update({ status: "pending", reviewed_by: null, reviewed_at: null })
      .eq("id", requestId);
    throw new Error(`ส่งคำเชิญไม่ได้: ${inviteError.message}`);
  }
}

export async function rejectRegistrationRequest(
  requestId: string,
  notes?: string
): Promise<void> {
  const db = (await createSupabaseServer()) as any;
  const reviewerId = await assertPlatformAdmin(db);

  const { error } = await db
    .from("registration_requests")
    .update({
      status: "rejected",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      notes: notes?.trim() || null,
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);
}
