"use server";

import type { SpatialNode } from "../model/spatial-node";
import type { SpatialNodeType } from "../model/spatial-node";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export interface UpdateSpatialNodeInput {
  name?: string;
  order?: number;
  metadata?: Record<string, unknown>;
}

export async function updateSpatialNode(
  id: string,
  input: UpdateSpatialNodeInput
): Promise<SpatialNode> {
  const db = (await createSupabaseServer()) as any;

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.order !== undefined) patch.order = input.order;
  if (input.metadata !== undefined) patch.metadata = input.metadata;

  const { data, error } = await db
    .from("spatial_nodes")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`updateSpatialNode: ${error.message}`);
  if (!data) throw new Error(`updateSpatialNode: node "${id}" not found`);

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
