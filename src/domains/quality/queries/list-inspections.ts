import type { Inspection, InspectionStatus } from "../model/inspection";
import { MOCK_INSPECTIONS } from "../model/mock-quality-data";
import { getSupabaseClient } from "@/lib/supabase/supabase-client";

export interface ListInspectionsFilter {
  projectId: string;
  status?: InspectionStatus;
  spatialNodeId?: string;
}

function rowToInspection(row: Record<string, unknown>): Inspection {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    spatialNodeId: (row.spatial_node_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    status: row.status as Inspection["status"],
    inspectionType: (row.inspection_type as string) ?? "general",
    result: (row.result as Inspection["result"]) ?? null,
    assignedTo: (row.assigned_to as string | null) ?? null,
    scheduledDate: row.scheduled_date ? new Date(row.scheduled_date as string) : null,
    inspectedDate: row.inspected_date ? new Date(row.inspected_date as string) : null,
    completedDate: row.completed_date ? new Date(row.completed_date as string) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function listInspections(
  filter: ListInspectionsFilter
): Promise<Inspection[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    let items = MOCK_INSPECTIONS.filter((i) => i.projectId === filter.projectId);
    if (filter.status !== undefined) items = items.filter((i) => i.status === filter.status);
    if (filter.spatialNodeId !== undefined) items = items.filter((i) => i.spatialNodeId === filter.spatialNodeId);
    return items;
  }

  const db = getSupabaseClient()!;
  let query = db.from("inspections").select("*").eq("project_id", filter.projectId);
  if (filter.status !== undefined) query = query.eq("status", filter.status);
  if (filter.spatialNodeId !== undefined) query = query.eq("spatial_node_id", filter.spatialNodeId);

  const { data, error } = await query;
  if (error) throw new Error(`listInspections: ${error.message}`);
  return (data ?? []).map((r: Record<string, unknown>) => rowToInspection(r));
}
