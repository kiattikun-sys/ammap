import type { TimelineEvent } from "../model/timeline-event";
import { MOCK_TIMELINE_EVENTS } from "../model/mock-timeline-data";

export async function listEventsBySpatialNode(
  spatialNodeId: string,
  before?: Date
): Promise<TimelineEvent[]> {
  let items = MOCK_TIMELINE_EVENTS.filter(
    (e) => e.spatialNodeId === spatialNodeId
  );
  if (before !== undefined) {
    items = items.filter((e) => e.timestamp <= before);
  }
  return items.sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
}
