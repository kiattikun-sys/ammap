"use server";

import type { ProgressRecord } from "../model/progress-record";
import {
  createProgressRecordSchema,
  type CreateProgressRecordInput,
} from "../validation/create-progress-record-schema";

export async function createProgressRecord(
  projectId: string,
  input: CreateProgressRecordInput
): Promise<ProgressRecord> {
  const validated = createProgressRecordSchema.parse(input);

  const record: ProgressRecord = {
    id: crypto.randomUUID(),
    projectId,
    spatialNodeId: validated.spatialNodeId ?? null,
    progressPercent: validated.progressPercent,
    status: validated.status,
    recordedAt: validated.recordedAt,
    recordedBy: validated.recordedBy ?? null,
    metadata: validated.metadata ?? {},
  };

  console.log("[createProgressRecord] Created (mock):", record);
  return record;
}
