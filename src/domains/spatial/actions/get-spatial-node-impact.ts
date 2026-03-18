"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export interface SpatialNodeImpact {
  subAreaCount: number;
  workItemCount: number;
  defectCount: number;
  inspectionCount: number;
  evidenceCount: number;
  timelineEventCount: number;
  progressRecordCount: number;
}

/**
 * Count rows in a table where column = id.
 * Throws on query error so the caller can distinguish real-zero from unknown.
 */
async function countRows(
  db: any,
  table: string,
  column: string,
  id: string
): Promise<number> {
  const { count, error } = await db
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, id);
  if (error) {
    throw new Error(`countRows(${table}): ${error.message}`);
  }
  return count ?? 0;
}

export async function getSpatialNodeImpact(
  nodeId: string
): Promise<SpatialNodeImpact> {
  const db = (await createSupabaseServer()) as any;

  const [
    subAreaCount,
    workItemCount,
    defectCount,
    inspectionCount,
    evidenceCount,
    timelineEventCount,
    progressRecordCount,
  ] = await Promise.all([
    countRows(db, "spatial_nodes", "parent_id", nodeId),
    countRows(db, "work_items", "spatial_node_id", nodeId),
    countRows(db, "defects", "spatial_node_id", nodeId),
    countRows(db, "inspections", "spatial_node_id", nodeId),
    countRows(db, "evidence", "spatial_node_id", nodeId),
    countRows(db, "timeline_events", "spatial_node_id", nodeId),
    countRows(db, "progress_records", "spatial_node_id", nodeId),
  ]);

  return {
    subAreaCount,
    workItemCount,
    defectCount,
    inspectionCount,
    evidenceCount,
    timelineEventCount,
    progressRecordCount,
  };
}
