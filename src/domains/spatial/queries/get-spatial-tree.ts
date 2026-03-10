import type { SpatialNode } from "../model/spatial-node";
import { MOCK_SPATIAL_NODES } from "../model/mock-spatial-data";

export interface SpatialTreeNode extends SpatialNode {
  children: SpatialTreeNode[];
}

function buildTree(
  nodes: SpatialNode[],
  parentId: string | null
): SpatialTreeNode[] {
  return nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map((n) => ({ ...n, children: buildTree(nodes, n.id) }));
}

export async function getSpatialTree(
  projectId: string
): Promise<SpatialTreeNode[]> {
  const nodes = MOCK_SPATIAL_NODES.filter((n) => n.projectId === projectId);
  return buildTree(nodes, null);
}
