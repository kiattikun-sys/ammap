"use server";

import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { SpatialNode } from "../model/spatial-node";
import { createSpatialNodeSchema, type CreateSpatialNodeInput } from "../validation/create-spatial-node-schema";

export async function createSpatialNode(
  projectId: string,
  input: CreateSpatialNodeInput
): Promise<SpatialNode> {
  const validated = createSpatialNodeSchema.parse(input);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (await createSupabaseServer()) as any;

  const geometry = validated.geometry?.geojson ?? null;

  const { data, error } = await db
    .from("spatial_nodes")
    .insert({
      project_id: projectId,
      parent_id: validated.parentId ?? null,
      type: validated.type,
      name: validated.name,
      geometry,
      order: 0,
      metadata: {},
    })
    .select()
    .single();

  if (error) throw new Error(`createSpatialNode: ${error.message}`);

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    parentId: (row.parent_id as string | null) ?? null,
    type: validated.type,
    name: row.name as string,
    geometry: (row.geometry as GeoJSON.Geometry | null) ?? null,
    geometryId: null,
    level: 0,
    order: (row.order as number) ?? 0,
    metadata: {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
