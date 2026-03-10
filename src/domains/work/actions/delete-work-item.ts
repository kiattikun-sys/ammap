"use server";

import { MOCK_WORK_ITEMS } from "../model/mock-work-data";

export async function deleteWorkItem(id: string): Promise<void> {
  const existing = MOCK_WORK_ITEMS.find((w) => w.id === id);
  if (!existing) throw new Error(`WorkItem "${id}" not found`);

  console.log("[deleteWorkItem] Deleted (mock):", id);
}
