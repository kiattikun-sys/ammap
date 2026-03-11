export type CorrectiveActionStatus =
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface CorrectiveAction {
  id: string;
  projectId: string;
  defectId: string;
  spatialNodeId: string | null;
  actionText: string;
  status: CorrectiveActionStatus;
  assignedToUserId: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
