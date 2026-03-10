"use server";

import type { WorkItem, WorkStatus, WorkPriority } from "../model/work-item";
import { MOCK_WORK_ITEMS } from "../model/mock-work-data";
import { getSupabaseClient } from "@/lib/supabase/supabase-client";

export interface UpdateWorkItemInput {
  title?: string;
  description?: string | null;
  status?: WorkStatus;
  priority?: WorkPriority;
  assignedTo?: string | null;
  dueDate?: Date | null;
  progress?: number;
  metadata?: Record<string, unknown>;
}

export async function updateWorkItem(
  id: string,
  input: UpdateWorkItemInput
): Promise<WorkItem> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const existing = MOCK_WORK_ITEMS.find((w) => w.id === id);
    if (!existing) throw new Error(`WorkItem "${id}" not found`);
    const updated: WorkItem = { ...existing, ...input, updatedAt: new Date() };
    console.log("[updateWorkItem] Updated (mock):", updated);
    return updated;
  }

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = input.status;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.assignedTo !== undefined) patch.assigned_to = input.assignedTo;
  if (input.dueDate !== undefined) patch.due_date = input.dueDate ? input.dueDate.toISOString() : null;
  if (input.progress !== undefined) patch.progress = input.progress;
  if (input.metadata !== undefined) patch.metadata = input.metadata;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getSupabaseClient()! as any;
  const { data, error } = await db
    .from("work_items")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`updateWorkItem: ${error.message}`);
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    spatialNodeId: (row.spatial_node_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    status: row.status as WorkStatus,
    priority: row.priority as WorkPriority,
    assignedTo: (row.assigned_to as string | null) ?? null,
    dueDate: row.due_date ? new Date(row.due_date as string) : null,
    progress: row.progress as number,
    progressPercent: (row.progress as number) ?? 0,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
