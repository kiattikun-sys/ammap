import { z } from "zod";

export const createProgressRecordSchema = z.object({
  spatialNodeId: z.string().nullable().optional(),
  progressPercent: z.number().min(0).max(100),
  status: z.enum(["not_started", "in_progress", "completed", "blocked"]).default("in_progress"),
  recordedAt: z.coerce.date().default(() => new Date()),
  recordedBy: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateProgressRecordInput = z.infer<typeof createProgressRecordSchema>;
