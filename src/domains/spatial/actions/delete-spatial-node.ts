"use server";

import { MOCK_SPATIAL_NODES } from "../model/mock-spatial-data";

export async function deleteSpatialNode(id: string): Promise<void> {
  const existing = MOCK_SPATIAL_NODES.find((n) => n.id === id);
  if (!existing) {
    throw new Error(`SpatialNode "${id}" not found`);
  }

  // TODO: delete from database
  console.log("[deleteSpatialNode] Deleted (mock):", id);
}
