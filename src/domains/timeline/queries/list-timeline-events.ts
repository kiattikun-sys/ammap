import type { TimelineEvent, TimelineEventType } from "../model/timeline-event";
import { MOCK_TIMELINE_EVENTS } from "../model/mock-timeline-data";
import { createSupabaseBrowser } from "@/lib/supabase/supabase-browser";

export interface ListTimelineEventsFilter {
  projectId: string;
  type?: TimelineEventType;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
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
  const limit = filter.limit ?? 50;
  const offset = filter.offset ?? 0;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    let items = MOCK_TIMELINE_EVENTS.filter((e) => e.projectId === filter.projectId);
    if (filter.type !== undefined) items = items.filter((e) => e.type === filter.type);
    if (filter.from !== undefined) items = items.filter((e) => e.timestamp >= filter.from!);
    if (filter.to !== undefined) items = items.filter((e) => e.timestamp <= filter.to!);
    return items
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
  }

  const db = createSupabaseBrowser();
  let query = db
    .from("timeline_events")
    .select("*")
    .eq("project_id", filter.projectId)
    .order("timestamp", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter.type !== undefined) query = query.eq("type", filter.type);
  if (filter.from !== undefined) query = query.gte("timestamp", filter.from.toISOString());
  if (filter.to !== undefined) query = query.lte("timestamp", filter.to.toISOString());

  const { data, error } = await query;
  if (error) throw new Error(`listTimelineEvents: ${error.message}`);
  return (data ?? []).map((r) => rowToTimelineEvent(r as Record<string, unknown>));
}
