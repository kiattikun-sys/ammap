export type ProgressStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "blocked";

export interface ProgressRecord {
  id: string;
  projectId: string;
  spatialNodeId: string | null;
  progressPercent: number;
  status: ProgressStatus;
  recordedAt: Date;
  recordedBy: string | null;
  metadata: Record<string, unknown>;
}
