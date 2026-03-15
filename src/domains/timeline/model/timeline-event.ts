export type TimelineEventType =
  | "construction_start"
  | "inspection"
  | "inspection_scheduled"
  | "inspection_completed"
  | "defect_created"
  | "defect_resolved"
  | "corrective_action_created"
  | "corrective_action_completed"
  | "work_item_created"
  | "work_item_started"
  | "work_item_blocked"
  | "work_item_completed"
  | "progress_updated"
  | "evidence_uploaded"
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
