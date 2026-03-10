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

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  organization_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

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

  if (error) {
    throw new Error(`listProjectsByOrganization: ${error.message}`);
  }

  const rows = (data ?? []) as ProjectRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    organizationId: row.organization_id,
    metadata: row.metadata ?? {},
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