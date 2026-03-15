import { z } from "zod";

export const createTimelineEventSchema = z.object({
  type: z.enum([
    "construction_start",
    "inspection",
    "inspection_scheduled",
    "inspection_completed",
    "defect_created",
    "defect_resolved",
    "corrective_action_created",
    "corrective_action_completed",
    "work_item_created",
    "work_item_started",
    "work_item_blocked",
    "work_item_completed",
    "progress_updated",
    "evidence_uploaded",
    "milestone",
  ]),
  title: z.string().min(1),
  spatialNodeId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  timestamp: z.coerce.date(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateTimelineEventInput = z.infer<
  typeof createTimelineEventSchema
>;