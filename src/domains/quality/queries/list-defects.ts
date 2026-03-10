import type { Defect, DefectSeverity, DefectStatus } from "../model/defect";
import { MOCK_DEFECTS } from "../model/mock-quality-data";
import { getSupabaseClient } from "@/lib/supabase/supabase-client";

export interface ListDefectsFilter {
  projectId: string;
  status?: DefectStatus;
  severity?: DefectSeverity;
  inspectionId?: string;
}

function rowToDefect(row: Record<string, unknown>): Defect {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    spatialNodeId: (row.spatial_node_id as string | null) ?? null,
    inspectionId: (row.inspection_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    severity: row.severity as DefectSeverity,
    status: row.status as DefectStatus,
    assignedTo: (row.assigned_to as string | null) ?? null,
    dueDate: row.due_date ? new Date(row.due_date as string) : null,
    locationLng: (row.location_lng as number | null) ?? null,
    locationLat: (row.location_lat as number | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function listDefects(
  filter: ListDefectsFilter
): Promise<Defect[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    let items = MOCK_DEFECTS.filter((d) => d.projectId === filter.projectId);
    if (filter.status !== undefined) items = items.filter((d) => d.status === filter.status);
    if (filter.severity !== undefined) items = items.filter((d) => d.severity === filter.severity);
    if (filter.inspectionId !== undefined) items = items.filter((d) => d.inspectionId === filter.inspectionId);
    return items;
  }

  const db = getSupabaseClient()!;
  let query = db.from("defects").select("*").eq("project_id", filter.projectId);
  if (filter.status !== undefined) query = query.eq("status", filter.status);
  if (filter.severity !== undefined) query = query.eq("severity", filter.severity);
  if (filter.inspectionId !== undefined) query = query.eq("inspection_id", filter.inspectionId);

  const { data, error } = await query;
  if (error) throw new Error(`listDefects: ${error.message}`);
  return (data ?? []).map((r) => rowToDefect(r as Record<string, unknown>));
}
