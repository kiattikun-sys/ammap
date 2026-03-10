import type { Evidence } from "../model/evidence";
import { MOCK_EVIDENCE } from "../model/mock-evidence-data";

export async function listEvidenceByWorkItem(
  workItemId: string
): Promise<Evidence[]> {
  return MOCK_EVIDENCE.filter((e) => e.workItemId === workItemId);
}
