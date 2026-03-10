import type { Defect } from "../model/defect";
import { MOCK_DEFECTS } from "../model/mock-quality-data";

export async function listDefectsBySpatialNode(
  spatialNodeId: string
): Promise<Defect[]> {
  return MOCK_DEFECTS.filter((d) => d.spatialNodeId === spatialNodeId);
}
