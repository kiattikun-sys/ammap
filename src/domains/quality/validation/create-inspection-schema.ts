import { z } from "zod";

export const createInspectionSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  spatialNodeId: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
  scheduledDate: z.coerce.date().nullable().optional(),
  description: z.string().nullable().optional(),
  inspectionType: z.string().optional(),
});

export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;
