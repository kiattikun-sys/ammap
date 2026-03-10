"use server";

import { MOCK_EVIDENCE } from "../model/mock-evidence-data";

export async function deleteEvidence(id: string): Promise<void> {
  const existing = MOCK_EVIDENCE.find((e) => e.id === id);
  if (!existing) throw new Error(`Evidence "${id}" not found`);

  console.log("[deleteEvidence] Deleted (mock):", id);
}
