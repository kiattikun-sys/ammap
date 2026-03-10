import type { Inspection, InspectionStatus } from "../model/inspection";
import { MOCK_INSPECTIONS } from "../model/mock-quality-data";

export interface ListInspectionsFilter {
  projectId: string;
  status?: InspectionStatus;
  spatialNodeId?: string;
}

export async function listInspections(
  filter: ListInspectionsFilter
): Promise<Inspection[]> {
  let items = MOCK_INSPECTIONS.filter(
    (i) => i.projectId === filter.projectId
  );
  if (filter.status !== undefined) {
    items = items.filter((i) => i.status === filter.status);
  }
  if (filter.spatialNodeId !== undefined) {
    items = items.filter((i) => i.spatialNodeId === filter.spatialNodeId);
  }
  return items;
}
