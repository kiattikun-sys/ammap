import type { Evidence } from "../model/evidence";
import { MOCK_EVIDENCE } from "../model/mock-evidence-data";

export async function listEvidenceByDefect(
  defectId: string
): Promise<Evidence[]> {
  return MOCK_EVIDENCE.filter((e) => e.defectId === defectId);
}
