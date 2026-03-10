import type { Evidence } from "../model/evidence";
import { MOCK_EVIDENCE } from "../model/mock-evidence-data";

export async function listEvidenceBySpatialNode(
  spatialNodeId: string
): Promise<Evidence[]> {
  return MOCK_EVIDENCE.filter((e) => e.spatialNodeId === spatialNodeId);
}
