"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export interface RegistrationRequest {
  id: string;
  email: string;
  fullName: string;
  companyName: string | null;
  phone: string | null;
  requestedOrgName: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

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

export async function listRegistrationRequests(
  statusFilter?: "pending" | "approved" | "rejected" | "all"
): Promise<RegistrationRequest[]> {
  const db = (await createSupabaseServer()) as any;
  await assertPlatformAdmin(db);

  let query = db
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
