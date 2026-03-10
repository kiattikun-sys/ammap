import { z } from "zod";

export const createTimelineEventSchema = z.object({
  type: z.enum([
    "construction_start",
    "inspection",
    "defect_created",
    "defect_resolved",
    "milestone",
  ]),
  title: z.string().min(1, "Title is required").max(255),
  spatialNodeId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  timestamp: z.coerce.date().default(() => new Date()),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateTimelineEventInput = z.infer<typeof createTimelineEventSchema>;
