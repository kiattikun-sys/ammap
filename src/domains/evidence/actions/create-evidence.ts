"use server";

import type { Evidence } from "../model/evidence";
import {
  createEvidenceSchema,
  type CreateEvidenceInput,
} from "../validation/create-evidence-schema";
import { getSupabaseClient } from "@/lib/supabase/supabase-client";

export async function createEvidence(
  projectId: string,
  input: CreateEvidenceInput
): Promise<Evidence> {
  const validated = createEvidenceSchema.parse(input);
  const now = new Date();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const evidence: Evidence = {
      id: crypto.randomUUID(),
      projectId,
      spatialNodeId: validated.spatialNodeId ?? null,
      workItemId: validated.workItemId ?? null,
      defectId: validated.defectId ?? null,
      type: validated.type,
      title: validated.title,
      description: validated.description ?? null,
      fileUrl: validated.fileUrl,
      thumbnailUrl: validated.thumbnailUrl ?? null,
      locationLng: validated.locationLng ?? null,
      locationLat: validated.locationLat ?? null,
      capturedBy: validated.capturedBy ?? null,
      capturedAt: validated.capturedAt ?? null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
    console.log("[createEvidence] Created (mock):", evidence);
    return evidence;
  }

  const db = getSupabaseClient()!;
  const { data, error } = await db
    .from("evidence")
    .insert({
      project_id: projectId,
      spatial_node_id: validated.spatialNodeId ?? null,
      work_item_id: validated.workItemId ?? null,
      defect_id: validated.defectId ?? null,
      type: validated.type,
      title: validated.title,
      description: validated.description ?? null,
      file_url: validated.fileUrl,
      thumbnail_url: validated.thumbnailUrl ?? null,
      location_lng: validated.locationLng ?? null,
      location_lat: validated.locationLat ?? null,
      captured_by: validated.capturedBy ?? null,
      captured_at: validated.capturedAt ? validated.capturedAt.toISOString() : null,
      metadata: {},
    })
    .select()
    .single();

  if (error) throw new Error(`createEvidence: ${error.message}`);
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    spatialNodeId: (row.spatial_node_id as string | null) ?? null,
    workItemId: (row.work_item_id as string | null) ?? null,
    defectId: (row.defect_id as string | null) ?? null,
    type: row.type as Evidence["type"],
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    fileUrl: row.file_url as string,
    thumbnailUrl: (row.thumbnail_url as string | null) ?? null,
    locationLng: (row.location_lng as number | null) ?? null,
    locationLat: (row.location_lat as number | null) ?? null,
    capturedBy: (row.captured_by as string | null) ?? null,
    capturedAt: row.captured_at ? new Date(row.captured_at as string) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
