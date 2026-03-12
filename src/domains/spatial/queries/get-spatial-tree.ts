import type { SpatialNode } from "../model/spatial-node";
import { listSpatialNodes } from "./list-spatial-nodes";

export interface SpatialTreeNode extends SpatialNode {
  children: SpatialTreeNode[];
}

export function buildTree(
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
  const nodes = await listSpatialNodes({ projectId });
  return buildTree(nodes, null);
}
