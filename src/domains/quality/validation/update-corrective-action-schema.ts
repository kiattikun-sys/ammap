import { z } from "zod";

export const updateCorrectiveActionSchema = z.object({
  status: z.enum(["open", "in_progress", "completed", "cancelled"]).optional(),
  assignedToUserId: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  actionText: z.string().min(1).max(2000).optional(),
});

export type UpdateCorrectiveActionInput = z.infer<typeof updateCorrectiveActionSchema>;
