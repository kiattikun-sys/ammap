export type InspectionStatus =
  | "scheduled"
  | "in_progress"
  | "completed";

export interface Inspection {
  id: string;
  projectId: string;
  spatialNodeId: string | null;
  title: string;
  description: string | null;
  status: InspectionStatus;
  assignedTo: string | null;
  scheduledDate: Date | null;
  completedDate: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
