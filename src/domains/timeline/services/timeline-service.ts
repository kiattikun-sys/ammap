import type { TimelineEvent } from "../model/timeline-event";
import type { ProgressRecord } from "../model/progress-record";
import {
  listTimelineEvents,
  type ListTimelineEventsFilter,
} from "../queries/list-timeline-events";
import { listEventsBySpatialNode } from "../queries/list-events-by-spatial-node";
import {
  listProgressRecords,
  type ListProgressRecordsFilter,
} from "../queries/list-progress-records";
import type { CreateTimelineEventInput } from "../validation/create-timeline-event-schema";
import type { CreateProgressRecordInput } from "../validation/create-progress-record-schema";

export class TimelineService {
  async createEvent(
    projectId: string,
    input: CreateTimelineEventInput
  ): Promise<TimelineEvent> {
    const { createTimelineEvent } = await import(
      "../actions/create-timeline-event"
    );
    return createTimelineEvent(projectId, input);
  }

  async createProgressRecord(
    projectId: string,
    input: CreateProgressRecordInput
  ): Promise<ProgressRecord> {
    const { createProgressRecord } = await import(
      "../actions/create-progress-record"
    );
    return createProgressRecord(projectId, input);
  }

  async listEvents(
    filter: ListTimelineEventsFilter
  ): Promise<TimelineEvent[]> {
    return listTimelineEvents(filter);
  }

  async listEventsByZone(
    spatialNodeId: string,
    before?: Date
  ): Promise<TimelineEvent[]> {
    return listEventsBySpatialNode(spatialNodeId, before);
  }

  async listProgressRecords(
    filter: ListProgressRecordsFilter
  ): Promise<ProgressRecord[]> {
    return listProgressRecords(filter);
  }
}

export const timelineService = new TimelineService();
