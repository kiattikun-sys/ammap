"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";

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

  const { error } = await db
    .from("registration_requests")
    .update({
      status: "approved",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      notes: notes?.trim() || null,
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);
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
