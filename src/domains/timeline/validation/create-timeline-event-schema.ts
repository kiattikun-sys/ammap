import { z } from "zod";

export const createTimelineEventSchema = z.object({
  type: z.enum([
    "construction_start",
    "inspection",
    "defect_created",
    "defect_resolved",
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