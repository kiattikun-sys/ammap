import type { Evidence, EvidenceType } from "../model/evidence";
import { MOCK_EVIDENCE } from "../model/mock-evidence-data";
import { getSupabaseClient } from "@/lib/supabase/supabase-client";

export interface ListEvidenceFilter {
  projectId: string;
  type?: EvidenceType;
}

function rowToEvidence(row: Record<string, unknown>): Evidence {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    spatialNodeId: (row.spatial_node_id as string | null) ?? null,
    workItemId: (row.work_item_id as string | null) ?? null,
    defectId: (row.defect_id as string | null) ?? null,
    type: row.type as EvidenceType,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    fileUrl: row.file_url as string,
    thumbnailUrl: (row.thumbnail_url as string | null) ?? null,
    locationLng: (row.location_lng as number | null) ?? null,
    locationLat: (row.location_lat as number | null) ?? null,
    capturedBy: (row.captured_by as string | null) ?? null,
    capturedAt: row.captured_at ? new Date(row.captured_at as string) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function listEvidence(
  filter: ListEvidenceFilter
): Promise<Evidence[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    let items = MOCK_EVIDENCE.filter((e) => e.projectId === filter.projectId);
    if (filter.type !== undefined) items = items.filter((e) => e.type === filter.type);
    return items;
  }

  const db = getSupabaseClient()!;
  let query = db.from("evidence").select("*").eq("project_id", filter.projectId);
  if (filter.type !== undefined) query = query.eq("type", filter.type);

  const { data, error } = await query;
  if (error) throw new Error(`listEvidence: ${error.message}`);
  return (data ?? []).map((r) => rowToEvidence(r as Record<string, unknown>));
}
