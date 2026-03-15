"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { WorkItem } from "../model/work-item";
import { requirePermission } from "@/lib/permissions/can-perform";
import { createTimelineEvent } from "@/domains/timeline/actions/create-timeline-event";

export async function updateWorkProgress(
  id: string,
  progressPercent: number
): Promise<WorkItem> {
  await requirePermission("update:work_progress");
  if (progressPercent < 0 || progressPercent > 100) {
    throw new Error("Progress must be between 0 and 100");
  }

  const status =
    progressPercent === 100 ? "completed" :
    progressPercent > 0 ? "in_progress" : "planned";

  const db = (await createSupabaseServer()) as any;

  const { data, error } = await db
    .from("work_items")
    .update({ progress: progressPercent, status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`updateWorkProgress: ${error.message}`);
  const row = data as Record<string, unknown>;
  const prog = (row.progress as number) ?? 0;
  const workItem: WorkItem = {
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

  const eventType =
    status === "completed" ? "work_item_completed" :
    status === "in_progress" ? "work_item_started" :
    "progress_updated";

  createTimelineEvent(workItem.projectId, {
    type: eventType,
    title: `Work item ${status}: ${workItem.title}`,
    spatialNodeId: workItem.spatialNodeId,
    timestamp: workItem.updatedAt,
    metadata: { workItemId: workItem.id, progress: prog },
  }).catch(() => {});

  return workItem;
}
