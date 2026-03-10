import type { WorkItem } from "../model/work-item";
import { MOCK_WORK_ITEMS } from "../model/mock-work-data";

export async function getWorkItem(id: string): Promise<WorkItem | null> {
  return MOCK_WORK_ITEMS.find((w) => w.id === id) ?? null;
}
