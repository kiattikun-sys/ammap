import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { listRegistrationRequests } from "@/domains/platform/actions/list-registration-requests";
import { RequestsClient } from "./requests-client";

async function isPlatformAdmin(userId: string): Promise<boolean> {
  const db = (await createSupabaseServer()) as any;
  const { data } = await db
    .from("platform_admins")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const db = await createSupabaseServer();
  const { data: { user } } = await db.auth.getUser();

  if (!user) redirect("/login");

  const allowed = await isPlatformAdmin(user.id);
  if (!allowed) redirect("/dashboard");

  const statusFilter = (searchParams.status as "pending" | "approved" | "rejected" | "all") ?? "pending";
  const requests = await listRegistrationRequests(statusFilter);

  return <RequestsClient requests={requests} currentFilter={statusFilter} />;
}
