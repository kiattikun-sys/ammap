export type InspectionStatus =
  | "scheduled"
  | "in_progress"
  | "completed";

export type InspectionResult = "pass" | "fail" | "conditional";

export interface Inspection {
  id: string;
  projectId: string;
  spatialNodeId: string | null;
  title: string;
  description: string | null;
  status: InspectionStatus;
  inspectionType: string;
  result: InspectionResult | null;
  assignedTo: string | null;
  scheduledDate: Date | null;
  inspectedDate: Date | null;
  completedDate: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
