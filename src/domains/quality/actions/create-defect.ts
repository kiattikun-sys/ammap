"use server";

import type { Defect } from "../model/defect";
import {
  createDefectSchema,
  type CreateDefectInput,
} from "../validation/create-defect-schema";
import { getSupabaseClient } from "@/lib/supabase/supabase-client";

export async function createDefect(
  projectId: string,
  input: CreateDefectInput
): Promise<Defect> {
  const validated = createDefectSchema.parse(input);
  const now = new Date();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const defect: Defect = {
      id: crypto.randomUUID(),
      projectId,
      spatialNodeId: validated.spatialNodeId ?? null,
      inspectionId: validated.inspectionId ?? null,
      title: validated.title,
      description: validated.description ?? null,
      severity: validated.severity,
      status: "open",
      assignedTo: validated.assignedTo ?? null,
      dueDate: validated.dueDate ?? null,
      locationLng: validated.locationLng ?? null,
      locationLat: validated.locationLat ?? null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
    console.log("[createDefect] Created (mock):", defect);
    return defect;
  }

  const db = getSupabaseClient()!;
  const { data, error } = await db
    .from("defects")
    .insert({
      project_id: projectId,
      spatial_node_id: validated.spatialNodeId ?? null,
      inspection_id: validated.inspectionId ?? null,
      title: validated.title,
      description: validated.description ?? null,
      severity: validated.severity,
      status: "open",
      assigned_to: validated.assignedTo ?? null,
      due_date: validated.dueDate ? validated.dueDate.toISOString() : null,
      location_lng: validated.locationLng ?? null,
      location_lat: validated.locationLat ?? null,
      metadata: {},
    })
    .select()
    .single();

  if (error) throw new Error(`createDefect: ${error.message}`);
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    spatialNodeId: (row.spatial_node_id as string | null) ?? null,
    inspectionId: (row.inspection_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    severity: row.severity as Defect["severity"],
    status: row.status as Defect["status"],
    assignedTo: (row.assigned_to as string | null) ?? null,
    dueDate: row.due_date ? new Date(row.due_date as string) : null,
    locationLng: (row.location_lng as number | null) ?? null,
    locationLat: (row.location_lat as number | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
