import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { Project, ProjectStatus } from "../model";

function rowToProject(row: Record<string, unknown>): Project {
  const archivedAt = row.archived_at ? new Date(row.archived_at as string) : null;
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    organizationId: (row.organization_id as string) ?? "",
    status: (row.status as ProjectStatus) ?? (archivedAt ? "archived" : "active"),
    startDate: row.start_date ? new Date(row.start_date as string) : undefined,
    endDate: row.end_date ? new Date(row.end_date as string) : undefined,
    archivedAt,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getProjectByIdServer(id: string): Promise<Project | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  const db = (await createSupabaseServer()) as any;
  const { data, error } = await db
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return rowToProject(data as Record<string, unknown>);
}
