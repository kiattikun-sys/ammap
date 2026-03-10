import type { Inspection } from "../model/inspection";
import { MOCK_INSPECTIONS } from "../model/mock-quality-data";

export async function getInspection(id: string): Promise<Inspection | null> {
  return MOCK_INSPECTIONS.find((i) => i.id === id) ?? null;
}
