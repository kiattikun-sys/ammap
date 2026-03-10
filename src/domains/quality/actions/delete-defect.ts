"use server";

import { MOCK_DEFECTS } from "../model/mock-quality-data";

export async function deleteDefect(id: string): Promise<void> {
  const existing = MOCK_DEFECTS.find((d) => d.id === id);
  if (!existing) throw new Error(`Defect "${id}" not found`);

  console.log("[deleteDefect] Deleted (mock):", id);
}
