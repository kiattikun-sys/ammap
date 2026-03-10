"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { WorkItem } from "../model/work-item";
import { createWorkItemSchema, type CreateWorkItemInput } from "../validation/create-work-item-schema";

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function createWorkItem(
  projectId: string,
  input: CreateWorkItemInput
): Promise<WorkItem> {
  const validated = createWorkItemSchema.parse(input);
  const db = (await createSupabaseServer()) as any;

  const now = new Date();

  const { data: { user } } = await db.auth.getUser();

  const status = "planned";
  const priority = validated.priority ?? "medium";
  const progress = 0;
  const assignedTo = validated.assignedTo ?? user?.id ?? null;
  const dueDate = validated.dueDate ?? addDays(now, 7);
  const description = validated.description ?? "";

  const { data, error } = await db
    .from("work_items")
    .insert({
      project_id: projectId,
      spatial_node_id: validated.spatialNodeId ?? null,
      title: validated.title,
      description,
      status,
      priority,
      assigned_to: assignedTo,
      due_date: dueDate.toISOString(),
      progress,
      metadata: {},
    })
    .select()
    .single();

  if (error) throw new Error(`createWorkItem: ${error.message}`);
  const row = data as Record<string, unknown>;
  const prog = (row.progress as number) ?? 0;
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    spatialNodeId: (row.spatial_node_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    status: row.status as WorkItem["status"],
    priority: row.priority as WorkItem["priority"],
    assignedTo: (row.assigned_to as string | null) ?? null,
    dueDate: row.due_date ? new Date(row.due_date as string) : null,
    progress: prog,
    progressPercent: prog,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
