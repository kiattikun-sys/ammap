export type WorkStatus =
  | "planned"
  | "in_progress"
  | "blocked"
  | "completed";

export type WorkPriority = "low" | "medium" | "high" | "critical";

export interface WorkItem {
  id: string;
  projectId: string;
  spatialNodeId: string | null;
  title: string;
  description: string | null;
  status: WorkStatus;
  priority: WorkPriority;
  assignedTo: string | null;
  dueDate: Date | null;
  progress: number;
  progressPercent: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
