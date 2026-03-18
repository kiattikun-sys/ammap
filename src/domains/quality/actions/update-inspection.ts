"use server";

import type { Inspection, InspectionStatus, InspectionResult } from "../model/inspection";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { requirePermission } from "@/lib/permissions/can-perform";
import { createTimelineEvent } from "@/domains/timeline/actions/create-timeline-event";

const ALLOWED_INSPECTION_TRANSITIONS: Record<InspectionStatus, InspectionStatus[]> = {
  scheduled: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
};

export interface UpdateInspectionInput {
  status?: InspectionStatus;
  result?: InspectionResult | null;
  inspectedDate?: Date | null;
  completedDate?: Date | null;
  assignedTo?: string | null;
  description?: string | null;
}

function rowToInspection(row: Record<string, unknown>): Inspection {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    spatialNodeId: (row.spatial_node_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    status: row.status as InspectionStatus,
    inspectionType: (row.inspection_type as string) ?? "general",
    result: (row.result as InspectionResult | null) ?? null,
    assignedTo: (row.assigned_to as string | null) ?? null,
    scheduledDate: row.scheduled_date ? new Date(row.scheduled_date as string) : null,
    inspectedDate: row.inspected_date ? new Date(row.inspected_date as string) : null,
    completedDate: row.completed_date ? new Date(row.completed_date as string) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function updateInspection(
  id: string,
  input: UpdateInspectionInput
): Promise<Inspection> {
  await requirePermission("update:inspection");
  const db = (await createSupabaseServer()) as any;

  if (input.status !== undefined) {
    const { data: current, error: fetchErr } = await db
      .from("inspections")
      .select("status")
      .eq("id", id)
      .single();
    if (fetchErr) throw new Error(`updateInspection: ${fetchErr.message}`);
    const currentStatus = (current as { status: InspectionStatus }).status;
    const allowed = ALLOWED_INSPECTION_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(input.status)) {
      throw new Error(
        `Invalid inspection transition: ${currentStatus} → ${input.status}. Allowed: ${allowed.join(", ") || "none"}`
      );
    }
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.status !== undefined) {
    patch.status = input.status;
    if (input.status === "completed") {
      patch.completed_date = input.completedDate
        ? input.completedDate.toISOString()
        : new Date().toISOString();
    }
  }
  if (input.result !== undefined) patch.result = input.result;
  if (input.inspectedDate !== undefined) {
    patch.inspected_date = input.inspectedDate ? input.inspectedDate.toISOString() : null;
  }
  if (input.completedDate !== undefined && input.status !== "completed") {
    patch.completed_date = input.completedDate ? input.completedDate.toISOString() : null;
  }
  if (input.assignedTo !== undefined) patch.assigned_to = input.assignedTo;
  if (input.description !== undefined) patch.description = input.description;

  const { data, error } = await db
    .from("inspections")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`updateInspection: ${error.message}`);
  const inspection = rowToInspection(data as Record<string, unknown>);

  if (input.status === "completed") {
    createTimelineEvent(inspection.projectId, {
      type: "inspection_completed",
      title: `Inspection completed: ${inspection.title}`,
      spatialNodeId: inspection.spatialNodeId,
      timestamp: inspection.completedDate ?? new Date(),
      metadata: { inspectionId: inspection.id, result: inspection.result },
    }).catch(() => {});
  }

  return inspection;
}
