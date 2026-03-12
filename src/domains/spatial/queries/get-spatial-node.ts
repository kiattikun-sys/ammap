import type { SpatialNode } from "../model/spatial-node";
import type { SpatialNodeType } from "../model/spatial-node";
import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";
import { MOCK_SPATIAL_NODES } from "../model/mock-spatial-data";

export async function getSpatialNode(id: string): Promise<SpatialNode | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return MOCK_SPATIAL_NODES.find((n) => n.id === id) ?? null;
  }

  const db = createSupabaseBrowser();
  const { data, error } = await db
    .from("spatial_nodes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`getSpatialNode: ${error.message}`);
  }
  if (!data) return null;

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
