import type { WorkItem, WorkStatus, WorkPriority } from "../model/work-item";
import { MOCK_WORK_ITEMS } from "../model/mock-work-data";
import { getSupabaseClient } from "@/lib/supabase/supabase-client";

export interface ListWorkItemsFilter {
  projectId: string;
  status?: WorkStatus;
  assignedTo?: string;
}

function rowToWorkItem(row: Record<string, unknown>): WorkItem {
  const prog = (row.progress as number) ?? 0;
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
    progress: prog,
    progressPercent: prog,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function listWorkItems(
  filter: ListWorkItemsFilter
): Promise<WorkItem[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    let items = MOCK_WORK_ITEMS.filter((w) => w.projectId === filter.projectId);
    if (filter.status !== undefined) items = items.filter((w) => w.status === filter.status);
    if (filter.assignedTo !== undefined) items = items.filter((w) => w.assignedTo === filter.assignedTo);
    return items;
  }

  const db = getSupabaseClient()!;
  let query = db.from("work_items").select("*").eq("project_id", filter.projectId);
  if (filter.status !== undefined) query = query.eq("status", filter.status);
  if (filter.assignedTo !== undefined) query = query.eq("assigned_to", filter.assignedTo);

  const { data, error } = await query;
  if (error) throw new Error(`listWorkItems: ${error.message}`);
  return (data ?? []).map((r) => rowToWorkItem(r as Record<string, unknown>));
}
