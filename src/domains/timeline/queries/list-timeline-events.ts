import type { TimelineEvent, TimelineEventType } from "../model/timeline-event";
import { MOCK_TIMELINE_EVENTS } from "../model/mock-timeline-data";
import { getSupabaseClient } from "@/lib/supabase/supabase-client";

export interface ListTimelineEventsFilter {
  projectId: string;
  type?: TimelineEventType;
  from?: Date;
  to?: Date;
}

function rowToTimelineEvent(row: Record<string, unknown>): TimelineEvent {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    spatialNodeId: (row.spatial_node_id as string | null) ?? null,
    type: row.type as TimelineEventType,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    timestamp: new Date(row.timestamp as string),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function listTimelineEvents(
  filter: ListTimelineEventsFilter
): Promise<TimelineEvent[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    let items = MOCK_TIMELINE_EVENTS.filter((e) => e.projectId === filter.projectId);
    if (filter.type !== undefined) items = items.filter((e) => e.type === filter.type);
    if (filter.from !== undefined) items = items.filter((e) => e.timestamp >= filter.from!);
    if (filter.to !== undefined) items = items.filter((e) => e.timestamp <= filter.to!);
    return items.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  const db = getSupabaseClient()!;
  let query = db
    .from("timeline_events")
    .select("*")
    .eq("project_id", filter.projectId)
    .order("timestamp");

  if (filter.type !== undefined) query = query.eq("type", filter.type);
  if (filter.from !== undefined) query = query.gte("timestamp", filter.from.toISOString());
  if (filter.to !== undefined) query = query.lte("timestamp", filter.to.toISOString());

  const { data, error } = await query;
  if (error) throw new Error(`listTimelineEvents: ${error.message}`);
  return (data ?? []).map((r) => rowToTimelineEvent(r as Record<string, unknown>));
}
