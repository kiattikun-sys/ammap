"use server";

import { createSupabaseAdmin } from "@/lib/supabase/supabase-admin";
import { assertPlatformAdmin } from "@/lib/platform/assert-platform-admin";

export interface RegistrationRequest {
  id: string;
  email: string;
  fullName: string;
  companyName: string | null;
  phone: string | null;
  requestedOrgName: string;
  status: "pending" | "approved" | "invited" | "activated" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
  invitedAt: string | null;
  inviteAttempts: number;
  lastInviteError: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listRegistrationRequests(
  statusFilter?: "pending" | "approved" | "invited" | "activated" | "rejected" | "all"
): Promise<RegistrationRequest[]> {
  await assertPlatformAdmin();

  // Use admin client to bypass RLS on registration_requests (platform_admins only policy)
  const adminDb = createSupabaseAdmin() as any;
  let query = adminDb
    .from("registration_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    companyName: row.company_name,
    phone: row.phone,
    requestedOrgName: row.requested_org_name,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    notes: row.notes,
    invitedAt: row.invited_at,
    inviteAttempts: row.invite_attempts ?? 0,
    lastInviteError: row.last_invite_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
