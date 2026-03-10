"use server";

import type { Inspection } from "../model/inspection";
import {
  createInspectionSchema,
  type CreateInspectionInput,
} from "../validation/create-inspection-schema";

export async function createInspection(
  projectId: string,
  input: CreateInspectionInput
): Promise<Inspection> {
  const validated = createInspectionSchema.parse(input);

  const now = new Date();
  const inspection: Inspection = {
    id: crypto.randomUUID(),
    projectId,
    spatialNodeId: validated.spatialNodeId ?? null,
    title: validated.title,
    description: validated.description ?? null,
    status: "scheduled",
    assignedTo: validated.assignedTo ?? null,
    scheduledDate: validated.scheduledDate ?? null,
    completedDate: null,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };

  console.log("[createInspection] Created (mock):", inspection);
  return inspection;
}
