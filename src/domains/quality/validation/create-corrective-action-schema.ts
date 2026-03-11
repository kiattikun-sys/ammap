import { z } from "zod";

export const createCorrectiveActionSchema = z.object({
  defectId: z.string().min(1),
  spatialNodeId: z.string().nullable().optional(),
  actionText: z.string().min(1, "Action text is required").max(2000),
  assignedToUserId: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});

export type CreateCorrectiveActionInput = z.infer<typeof createCorrectiveActionSchema>;
