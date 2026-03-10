import { z } from "zod";

export const createWorkItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  spatialNodeId: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  assignedTo: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  description: z.string().nullable().optional(),
});

export type CreateWorkItemInput = z.infer<typeof createWorkItemSchema>;
