"use server";

import type { CorrectiveAction } from "../model/corrective-action";
import {
  updateCorrectiveActionSchema,
  type UpdateCorrectiveActionInput,
} from "../validation/update-corrective-action-schema";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

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

export async function updateCorrectiveAction(
  id: string,
  input: UpdateCorrectiveActionInput
): Promise<CorrectiveAction> {
  const validated = updateCorrectiveActionSchema.parse(input);
  const db = (await createSupabaseServer()) as any;

  const patch: Record<string, unknown> = {};
  if (validated.status !== undefined) {
    patch.status = validated.status;
    if (validated.status === "completed") {
      patch.completed_at = new Date().toISOString();
    }
  }
  if (validated.assignedToUserId !== undefined) patch.assigned_to_user_id = validated.assignedToUserId;
  if (validated.dueDate !== undefined) {
    patch.due_date = validated.dueDate ? validated.dueDate.toISOString().split("T")[0] : null;
  }
  if (validated.actionText !== undefined) patch.action_text = validated.actionText;

  const { data, error } = await db
    .from("corrective_actions")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`updateCorrectiveAction: ${error.message}`);
  return rowToCorrectiveAction(data as Record<string, unknown>);
}
