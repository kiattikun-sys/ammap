import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { Project } from "../model";

function rowToProject(row: Record<string, unknown>): Project {
  const archivedAt = row.archived_at ? new Date(row.archived_at as string) : null;
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    organizationId: (row.organization_id as string) ?? "",
    status: archivedAt ? "archived" : "active",
    archivedAt,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function listProjectsServer(): Promise<Project[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  const db = (await createSupabaseServer()) as any;

  const { data: { user } } = await db.auth.getUser();
  if (!user) return [];

  const { data: membership } = await db
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const orgId = (membership as { organization_id: string } | null)?.organization_id;
  if (!orgId) return [];

  const { data, error } = await db
    .from("projects")
    .select("*")
    .eq("organization_id", orgId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listProjectsServer: ${error.message}`);
  return (data ?? []).map((r: unknown) => rowToProject(r as Record<string, unknown>));
}
