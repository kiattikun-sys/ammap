import { z } from "zod";

export const createDefectSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  spatialNodeId: z.string().nullable().optional(),
  inspectionId: z.string().nullable().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  assignedTo: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  description: z.string().nullable().optional(),
  locationLng: z.number().min(-180).max(180).nullable().optional(),
  locationLat: z.number().min(-90).max(90).nullable().optional(),
});

export type CreateDefectInput = z.infer<typeof createDefectSchema>;
