import type { Evidence } from "../model/evidence";
import { MOCK_EVIDENCE } from "../model/mock-evidence-data";

export async function getEvidence(id: string): Promise<Evidence | null> {
  return MOCK_EVIDENCE.find((e) => e.id === id) ?? null;
}
