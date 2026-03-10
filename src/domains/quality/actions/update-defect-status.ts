"use server";

import type { Defect, DefectStatus } from "../model/defect";
import { MOCK_DEFECTS } from "../model/mock-quality-data";
import { getSupabaseClient } from "@/lib/supabase/supabase-client";

export async function updateDefectStatus(
  id: string,
  status: DefectStatus
): Promise<Defect> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const existing = MOCK_DEFECTS.find((d) => d.id === id);
    if (!existing) throw new Error(`Defect "${id}" not found`);
    const updated: Defect = { ...existing, status, updatedAt: new Date() };
    console.log("[updateDefectStatus] Updated (mock):", { id, status });
    return updated;
  }

  const db = getSupabaseClient()!;
  const { data, error } = await db
    .from("defects")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`updateDefectStatus: ${error.message}`);
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    spatialNodeId: (row.spatial_node_id as string | null) ?? null,
    inspectionId: (row.inspection_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    severity: row.severity as Defect["severity"],
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
