"use server";

import type { SpatialNode, SpatialNodeType } from "../model/spatial-node";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { requirePermission } from "@/lib/permissions/can-perform";

export async function updateSpatialNodeGeometry(
  nodeId: string,
  geometry: GeoJSON.Geometry
): Promise<SpatialNode> {
  await requirePermission("create:spatial_node");
  const db = (await createSupabaseServer()) as any;

  const { data, error } = await db
    .from("spatial_nodes")
    .update({ geometry })
    .eq("id", nodeId)
    .select()
    .single();

  if (error) throw new Error(`updateSpatialNodeGeometry: ${error.message}`);
  if (!data) throw new Error(`updateSpatialNodeGeometry: node "${nodeId}" not found`);

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    parentId: (row.parent_id as string | null) ?? null,
    type: row.type as SpatialNodeType,
    name: row.name as string,
    geometry: (row.geometry as GeoJSON.Geometry | null) ?? null,
    geometryId: null,
    level: 0,
    order: (row.order as number) ?? 0,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
