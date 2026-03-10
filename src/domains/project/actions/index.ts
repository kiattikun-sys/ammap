"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { Project } from "../model";

export async function createProject(formData: FormData): Promise<Project> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const description = (formData.get("description") as string | null)?.trim() ?? "";

  if (!name) throw new Error("Project name is required");

  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  console.log("[createProject] user:", user?.id ?? "null");
  console.log("[createProject] authErr:", authErr?.message ?? "none");

  if (!user) throw new Error("Not authenticated");

  const { data: membership, error: memberErr } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  console.log("[createProject] membership raw:", membership);
  console.log("[createProject] memberErr:", memberErr?.message ?? "none");

  const orgId = (membership as { organization_id: string } | null)?.organization_id ?? null;
  console.log("[createProject] orgId:", orgId);

  if (!orgId) throw new Error("No organization found");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: project, error: projectError } = await db
    .from("projects")
    .insert({
      name,
      description,
      organization_id: orgId,
      metadata: {},
    })
    .select()
    .single();

  console.log("[createProject] project:", project);
  console.log("[createProject] projectError:", projectError?.message ?? "none");

  if (projectError || !project) {
    throw new Error(`createProject: ${projectError?.message ?? "insert failed"}`);
  }

  const { error: projectMemberError } = await db.from("project_members").insert({
    project_id: project.id,
    user_id: user.id,
    role: "manager",
  });

  console.log("[createProject] projectMemberError:", projectMemberError?.message ?? "none");

  const row = project as Record<string, unknown>;
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? undefined,
    organizationId: row.organization_id as string,
    status: "active",
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}