export type TimelineEventType =
  | "construction_start"
  | "inspection"
  | "defect_created"
  | "defect_resolved"
  | "milestone";

export interface TimelineEvent {
  id: string;
  projectId: string;
  spatialNodeId: string | null;
  type: TimelineEventType;
  title: string;
  description: string | null;
  timestamp: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
