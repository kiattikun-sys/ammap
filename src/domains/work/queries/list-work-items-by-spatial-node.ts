import type { WorkItem } from "../model/work-item";
import { MOCK_WORK_ITEMS } from "../model/mock-work-data";

export async function listWorkItemsBySpatialNode(
  spatialNodeId: string
): Promise<WorkItem[]> {
  return MOCK_WORK_ITEMS.filter((w) => w.spatialNodeId === spatialNodeId);
}
