import type { SpatialNode, SpatialNodeType } from "../model/spatial-node";
import { MOCK_SPATIAL_NODES } from "../model/mock-spatial-data";
import { getSupabaseClient } from "@/lib/supabase/supabase-client";

export interface ListSpatialNodesFilter {
  projectId: string;
  type?: SpatialNodeType;
  parentId?: string | null;
}

function rowToSpatialNode(row: Record<string, unknown>): SpatialNode {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    parentId: (row.parent_id as string | null) ?? null,
    type: row.type as SpatialNodeType,
    name: row.name as string,
    geometry: (row.geometry as GeoJSON.Geometry | null) ?? null,
    geometryId: (row.geometry_id as string | null) ?? null,
    level: (row.level as number) ?? 0,
    order: (row.order as number) ?? 0,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function listSpatialNodes(
  filter: ListSpatialNodesFilter
): Promise<SpatialNode[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    let nodes = MOCK_SPATIAL_NODES.filter((n) => n.projectId === filter.projectId);
    if (filter.type !== undefined) nodes = nodes.filter((n) => n.type === filter.type);
    if (filter.parentId !== undefined) nodes = nodes.filter((n) => n.parentId === filter.parentId);
    return nodes.sort((a, b) => a.order - b.order);
  }

  const db = getSupabaseClient()!;
  let query = db
    .from("spatial_nodes")
    .select("*")
    .eq("project_id", filter.projectId)
    .order("order");

  if (filter.type !== undefined) query = query.eq("type", filter.type);
  if (filter.parentId !== undefined) {
    query = filter.parentId === null
      ? query.is("parent_id", null)
      : query.eq("parent_id", filter.parentId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`listSpatialNodes: ${error.message}`);
  return (data ?? []).map((r) => rowToSpatialNode(r as Record<string, unknown>));
}
