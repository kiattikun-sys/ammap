import type { Inspection } from "../model/inspection";
import { MOCK_INSPECTIONS } from "../model/mock-quality-data";
import { getSupabaseClient } from "@/lib/supabase/supabase-client";

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

export async function getInspection(id: string): Promise<Inspection | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return MOCK_INSPECTIONS.find((i) => i.id === id) ?? null;
  }
  const db = getSupabaseClient()!;
  const { data, error } = await db.from("inspections").select("*").eq("id", id).single();
  if (error) return null;
  return rowToInspection(data as Record<string, unknown>);
}
