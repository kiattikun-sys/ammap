import { getSupabaseClient } from "@/lib/supabase/supabase-client";

export interface OrgProject {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export async function listProjectsByOrganization(
  organizationId: string
): Promise<OrgProject[]> {
  const db = getSupabaseClient();
  if (!db) return [];

  const { data, error } = await db
    .from("projects")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listProjectsByOrganization: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    organizationId: (row as Record<string, unknown>).organization_id as string,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }));
}

export async function getUserOrganization(userId: string) {
  const db = getSupabaseClient();
  if (!db) return null;

  const { data, error } = await db
    .from("organization_members")
    .select("organization_id, role, organizations(id, name, owner_id)")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (error) return null;
  return data;
}
