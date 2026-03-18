"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase/supabase-admin";

async function assertPlatformAdmin(db: any): Promise<string> {
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");

  // Use admin client to bypass RLS self-reference recursion on platform_admins
  const adminDb = createSupabaseAdmin() as any;
  const { data: admin } = await adminDb
    .from("platform_admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) throw new Error("Forbidden: platform admin access required");
  return user.id;
}

async function sendInvite(
  db: any,
  requestId: string,
  email: string,
  fullName: string,
  orgName: string,
  reviewerId: string,
  isResend: boolean
): Promise<void> {
  const adminClient = createSupabaseAdmin();
  const now = new Date().toISOString();

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    { data: { full_name: fullName, org_name: orgName } }
  );

  // Read current attempt count before modifying
  const { data: currentRow } = await db
    .from("registration_requests")
    .select("invite_attempts")
    .eq("id", requestId)
    .single();

  const currentAttempts: number = currentRow?.invite_attempts ?? 0;

  if (inviteError) {
    // Record failure — status stays 'approved' so resend can retry
    await db
      .from("registration_requests")
      .update({
        last_invite_error: inviteError.message,
        invite_attempts: currentAttempts + 1,
        updated_at: now,
      })
      .eq("id", requestId);

    // Audit: invite_failed
    await db.from("registration_request_events").insert({
      request_id: requestId,
      event_type: "invite_failed",
      performed_by: reviewerId,
      metadata: { error: inviteError.message, email, attempt: currentAttempts + 1 },
    });

    throw new Error(`ส่งคำเชิญไม่ได้: ${inviteError.message}`);
  }

  // Success — advance to 'invited'
  await db
    .from("registration_requests")
    .update({
      status: "invited",
      invited_at: now,
      invite_attempts: currentAttempts + 1,
      last_invite_error: null,
      updated_at: now,
    })
    .eq("id", requestId);

  // Audit: invited or resend_invite
  await db.from("registration_request_events").insert({
    request_id: requestId,
    event_type: isResend ? "resend_invite" : "invited",
    performed_by: reviewerId,
    metadata: { email, attempt: currentAttempts + 1 },
  });
}

// ── Approve ──────────────────────────────────────────────────────

export async function approveRegistrationRequest(
  requestId: string,
  notes?: string
): Promise<void> {
  const db = (await createSupabaseServer()) as any;
  const reviewerId = await assertPlatformAdmin(db);

  // Fetch request — must be in 'pending' state
  const { data: request, error: fetchError } = await db
    .from("registration_requests")
    .select("id, email, full_name, requested_org_name, status, invited_at")
    .eq("id", requestId)
    .eq("status", "pending")
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!request) throw new Error("คำขอไม่พบ หรืออยู่ในสถานะที่ไม่สามารถอนุมัติได้");

  const now = new Date().toISOString();

  // 1. Set status='approved' FIRST so trigger gate finds this row
  const { error: approveError } = await db
    .from("registration_requests")
    .update({
      status: "approved",
      reviewed_by: reviewerId,
      reviewed_at: now,
      notes: notes?.trim() || null,
      updated_at: now,
    })
    .eq("id", requestId);

  if (approveError) throw new Error(approveError.message);

  // Audit: approved
  await db.from("registration_request_events").insert({
    request_id: requestId,
    event_type: "approved",
    performed_by: reviewerId,
    metadata: { notes: notes?.trim() || null },
  });

  // 2. Send invite — advances status to 'invited' on success,
  //    logs invite_failed on failure (status stays 'approved' for retry)
  await sendInvite(
    db,
    requestId,
    request.email,
    request.full_name,
    request.requested_org_name,
    reviewerId,
    false
  );
}

// ── Reject ───────────────────────────────────────────────────────

export async function rejectRegistrationRequest(
  requestId: string,
  notes?: string
): Promise<void> {
  const db = (await createSupabaseServer()) as any;
  const reviewerId = await assertPlatformAdmin(db);

  const now = new Date().toISOString();

  const { error } = await db
    .from("registration_requests")
    .update({
      status: "rejected",
      reviewed_by: reviewerId,
      reviewed_at: now,
      notes: notes?.trim() || null,
      updated_at: now,
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);

  // Audit: rejected
  await db.from("registration_request_events").insert({
    request_id: requestId,
    event_type: "rejected",
    performed_by: reviewerId,
    metadata: { notes: notes?.trim() || null },
  });
}

// ── Resend Invite ────────────────────────────────────────────────

export async function resendInvite(
  requestId: string
): Promise<void> {
  const db = (await createSupabaseServer()) as any;
  const reviewerId = await assertPlatformAdmin(db);

  // Only resendable if status is 'invited' or 'approved' (invite may have failed previously)
  const { data: request, error: fetchError } = await db
    .from("registration_requests")
    .select("id, email, full_name, requested_org_name, status, invited_at")
    .eq("id", requestId)
    .in("status", ["approved", "invited"])
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!request) throw new Error("คำขอไม่พบ หรืออยู่ในสถานะที่ไม่สามารถส่งคำเชิญซ้ำได้");

  await sendInvite(
    db,
    requestId,
    request.email,
    request.full_name,
    request.requested_org_name,
    reviewerId,
    true
  );
}
