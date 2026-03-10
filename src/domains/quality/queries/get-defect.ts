import type { Defect } from "../model/defect";
import { MOCK_DEFECTS } from "../model/mock-quality-data";

export async function getDefect(id: string): Promise<Defect | null> {
  return MOCK_DEFECTS.find((d) => d.id === id) ?? null;
}
