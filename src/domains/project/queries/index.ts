import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";
import { getCurrentUser } from "@/domains/auth/services/auth-service";
import type { Project } from "../model";

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    organizationId: (row.organization_id as string) ?? "",
    status: "active",
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = createSupabaseBrowser();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return rowToProject(data as Record<string, unknown>);
}

export async function listProjects(): Promise<Project[]> {
  const supabase = createSupabaseBrowser();
  const user = await getCurrentUser();
  if (!user) return [];

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) return [];

  
  const { data, error } = await (supabase as any)
    .from("projects")
    .select("*")
    .eq("organization_id", (membership as any).organization_id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listProjects: ${error.message}`);
  return (data ?? []).map((r: unknown) => rowToProject(r as Record<string, unknown>));
}
