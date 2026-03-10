"use server";

import type { SpatialNode } from "../model/spatial-node";
import { MOCK_SPATIAL_NODES } from "../model/mock-spatial-data";

export interface UpdateSpatialNodeInput {
  name?: string;
  order?: number;
  metadata?: Record<string, unknown>;
}

export async function updateSpatialNode(
  id: string,
  input: UpdateSpatialNodeInput
): Promise<SpatialNode> {
  const existing = MOCK_SPATIAL_NODES.find((n) => n.id === id);
  if (!existing) {
    throw new Error(`SpatialNode "${id}" not found`);
  }

  // TODO: persist to database
  const updated: SpatialNode = {
    ...existing,
    ...input,
    updatedAt: new Date(),
  };

  console.log("[updateSpatialNode] Updated (mock):", updated);
  return updated;
}
