"use server";

import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseClient } from "@/lib/supabase/supabase-client";
import type { TimelineEvent } from "../model/timeline-event";
import {
  createTimelineEventSchema,
  type CreateTimelineEventInput,
} from "../validation/create-timeline-event-schema";

export async function createTimelineEvent(
  projectId: string,
  input: CreateTimelineEventInput
): Promise<TimelineEvent> {
  const validated = createTimelineEventSchema.parse(input);
  const now = new Date();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const event: TimelineEvent = {
      id: crypto.randomUUID(),
      projectId,
      spatialNodeId: validated.spatialNodeId ?? null,
      type: validated.type,
      title: validated.title,
      description: validated.description ?? null,
      timestamp: validated.timestamp,
      metadata: (validated.metadata ?? {}) as Record<string, unknown>,
      createdAt: now,
      updatedAt: now,
    };

    console.log("[createTimelineEvent] Created (mock):", event);
    return event;
  }

  const db = getSupabaseClient()!;

  const insertPayload = {
    project_id: projectId,
    spatial_node_id: validated.spatialNodeId ?? null,
    type: validated.type,
    title: validated.title,
    description: validated.description ?? null,
    timestamp: validated.timestamp.toISOString(),
    metadata: (validated.metadata ?? {}) as Json,
  };

  const { data, error } = await db
    .from("timeline_events")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    throw new Error(`createTimelineEvent: ${error.message}`);
  }

  const row = data as Record<string, unknown>;

  return {
    id: row.id as string,
    projectId: row.project_id as string,
    spatialNodeId: (row.spatial_node_id as string | null) ?? null,
    type: row.type as TimelineEvent["type"],
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    timestamp: new Date(row.timestamp as string),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}