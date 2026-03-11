"use server";

import type { CorrectiveAction } from "../model/corrective-action";
import {
  createCorrectiveActionSchema,
  type CreateCorrectiveActionInput,
} from "../validation/create-corrective-action-schema";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import { createTimelineEvent } from "@/domains/timeline/actions/create-timeline-event";

function rowToCorrectiveAction(row: Record<string, unknown>): CorrectiveAction {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    defectId: row.defect_id as string,
    spatialNodeId: (row.spatial_node_id as string | null) ?? null,
    actionText: row.action_text as string,
    status: row.status as CorrectiveAction["status"],
    assignedToUserId: (row.assigned_to_user_id as string | null) ?? null,
    dueDate: row.due_date ? new Date(row.due_date as string) : null,
    completedAt: row.completed_at ? new Date(row.completed_at as string) : null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

export async function createCorrectiveAction(
  projectId: string,
  input: CreateCorrectiveActionInput
): Promise<CorrectiveAction> {
  const validated = createCorrectiveActionSchema.parse(input);
  const db = (await createSupabaseServer()) as any;

  const { data, error } = await db
    .from("corrective_actions")
    .insert({
      project_id: projectId,
      defect_id: validated.defectId,
      spatial_node_id: validated.spatialNodeId ?? null,
      action_text: validated.actionText,
      status: "open",
      assigned_to_user_id: validated.assignedToUserId ?? null,
      due_date: validated.dueDate ? validated.dueDate.toISOString().split("T")[0] : null,
    })
    .select()
    .single();

  if (error) throw new Error(`createCorrectiveAction: ${error.message}`);
  const ca = rowToCorrectiveAction(data as Record<string, unknown>);

  createTimelineEvent(projectId, {
    type: "defect_created",
    title: `Corrective action assigned`,
    spatialNodeId: ca.spatialNodeId,
    timestamp: ca.createdAt,
    metadata: { correctiveActionId: ca.id, defectId: ca.defectId },
  }).catch(() => {});

  return ca;
}
