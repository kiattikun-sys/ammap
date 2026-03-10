import type { ProgressRecord } from "../model/progress-record";
import { MOCK_PROGRESS_RECORDS } from "../model/mock-timeline-data";

export interface ListProgressRecordsFilter {
  projectId: string;
  spatialNodeId?: string;
  before?: Date;
}

export async function listProgressRecords(
  filter: ListProgressRecordsFilter
): Promise<ProgressRecord[]> {
  let items = MOCK_PROGRESS_RECORDS.filter(
    (r) => r.projectId === filter.projectId
  );
  if (filter.spatialNodeId !== undefined) {
    items = items.filter((r) => r.spatialNodeId === filter.spatialNodeId);
  }
  if (filter.before !== undefined) {
    items = items.filter((r) => r.recordedAt <= filter.before!);
  }
  return items.sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime()
  );
}
