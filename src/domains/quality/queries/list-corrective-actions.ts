import type { CorrectiveAction } from "../model/corrective-action";
import { MOCK_CORRECTIVE_ACTIONS } from "../model/mock-quality-data";
import { getSupabaseClient } from "@/lib/supabase/supabase-client";

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

export async function listCorrectiveActions(defectId: string): Promise<CorrectiveAction[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return MOCK_CORRECTIVE_ACTIONS.filter((a) => a.defectId === defectId);
  }
  const db = getSupabaseClient()!;
  const { data, error } = await db
    .from("corrective_actions")
    .select("*")
    .eq("defect_id", defectId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`listCorrectiveActions: ${error.message}`);
  return (data ?? []).map((r: Record<string, unknown>) => rowToCorrectiveAction(r));
}
