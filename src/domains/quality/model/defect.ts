export type DefectSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type DefectStatus =
  | "open"
  | "in_progress"
  | "pending_reinspection"
  | "resolved"
  | "closed";

export interface Defect {
  id: string;
  projectId: string;
  spatialNodeId: string | null;
  inspectionId: string | null;
  title: string;
  description: string | null;
  severity: DefectSeverity;
  status: DefectStatus;
  assignedTo: string | null;
  dueDate: Date | null;
  closedAt: Date | null;
  locationLng: number | null;
  locationLat: number | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
