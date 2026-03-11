import type { Defect } from "../model/defect";
import { MOCK_DEFECTS } from "../model/mock-quality-data";
import { getSupabaseClient } from "@/lib/supabase/supabase-client";

function rowToDefect(row: Record<string, unknown>): Defect {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    spatialNodeId: (row.spatial_node_id as string | null) ?? null,
    inspectionId: (row.inspection_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    severity: row.severity as Defect["severity"],
    status: row.status as Defect["status"],
    assignedTo: (row.assigned_to as string | null) ?? null,
    dueDate: row.due_date ? new Date(row.due_date as string) : null,
    closedAt: row.closed_at ? new Date(row.closed_at as string) : null,
    locationLng: (row.location_lng as number | null) ?? null,
    locationLat: (row.location_lat as number | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function getDefect(id: string): Promise<Defect | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return MOCK_DEFECTS.find((d) => d.id === id) ?? null;
  }
  const db = getSupabaseClient()!;
  const { data, error } = await db.from("defects").select("*").eq("id", id).single();
  if (error) return null;
  return rowToDefect(data as Record<string, unknown>);
}
