import type { SpatialNode } from "../model/spatial-node";
import { MOCK_SPATIAL_NODES } from "../model/mock-spatial-data";

export async function getSpatialNode(id: string): Promise<SpatialNode | null> {
  return MOCK_SPATIAL_NODES.find((n) => n.id === id) ?? null;
}
