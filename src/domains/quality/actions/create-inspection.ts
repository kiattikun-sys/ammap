"use server";

import type { Inspection } from "../model/inspection";
import {
  createInspectionSchema,
  type CreateInspectionInput,
} from "../validation/create-inspection-schema";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

function rowToInspection(row: Record<string, unknown>): Inspection {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    spatialNodeId: (row.spatial_node_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    status: row.status as Inspection["status"],
    inspectionType: (row.inspection_type as string) ?? "general",
    result: (row.result as Inspection["result"]) ?? null,
    assignedTo: (row.assigned_to as string | null) ?? null,
    scheduledDate: row.scheduled_date ? new Date(row.scheduled_date as string) : null,
    inspectedDate: row.inspected_date ? new Date(row.inspected_date as string) : null,
    completedDate: row.completed_date ? new Date(row.completed_date as string) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function createInspection(
  projectId: string,
  input: CreateInspectionInput
): Promise<Inspection> {
  const validated = createInspectionSchema.parse(input);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const now = new Date();
    const inspection: Inspection = {
      id: crypto.randomUUID(),
      projectId,
      spatialNodeId: validated.spatialNodeId ?? null,
      title: validated.title,
      description: validated.description ?? null,
      status: "scheduled",
      inspectionType: validated.inspectionType ?? "general",
      result: null,
      assignedTo: validated.assignedTo ?? null,
      scheduledDate: validated.scheduledDate ?? null,
      inspectedDate: null,
      completedDate: null,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };
    console.log("[createInspection] Created (mock):", inspection);
    return inspection;
  }

  const db = (await createSupabaseServer()) as any;
  const { data, error } = await db
    .from("inspections")
    .insert({
      project_id: projectId,
      spatial_node_id: validated.spatialNodeId ?? null,
      title: validated.title,
      description: validated.description ?? null,
      status: "scheduled",
      inspection_type: validated.inspectionType ?? "general",
      assigned_to: validated.assignedTo ?? null,
      scheduled_date: validated.scheduledDate ? validated.scheduledDate.toISOString() : null,
      metadata: {},
    })
    .select()
    .single();

  if (error) throw new Error(`createInspection: ${error.message}`);
  return rowToInspection(data as Record<string, unknown>);
}
