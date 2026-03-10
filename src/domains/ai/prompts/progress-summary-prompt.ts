import type { WorkItem } from "@/domains/work/model/work-item";
import type { ProgressRecord } from "@/domains/timeline/model/progress-record";
import type { TimelineEvent } from "@/domains/timeline/model/timeline-event";

export interface ProgressSummaryPromptInput {
  projectId: string;
  workItems: WorkItem[];
  progressRecords: ProgressRecord[];
  events: TimelineEvent[];
}

export function buildProgressSummaryPrompt(
  input: ProgressSummaryPromptInput
): string {
  const { projectId, workItems, progressRecords, events } = input;

  const taskSummary = workItems
    .map(
      (w) =>
        `- [${w.status}] ${w.title} — ${w.progress}% complete (priority: ${w.priority}, zone: ${w.spatialNodeId ?? "unassigned"})`
    )
    .join("\n");

  const progressSummary = progressRecords
    .map(
      (r) =>
        `- Zone ${r.spatialNodeId ?? "unknown"}: ${r.progressPercent}% (${r.status}) recorded ${r.recordedAt.toISOString().split("T")[0]}`
    )
    .join("\n");

  const milestoneSummary = events
    .filter((e) => e.type === "milestone" || e.type === "construction_start")
    .map((e) => `- [${e.timestamp.toISOString().split("T")[0]}] ${e.title}`)
    .join("\n");

  return `You are an expert construction project manager.

Project ID: ${projectId}

## Work Items (${workItems.length})
${taskSummary || "None"}

## Progress Records (${progressRecords.length})
${progressSummary || "None"}

## Key Milestones
${milestoneSummary || "None"}

Generate a concise progress summary report covering:
1. Overall project completion percentage estimate.
2. Per-zone progress status.
3. Tasks at risk of delay.
4. Recommended next actions.

Respond with a structured JSON object:
{ "overallProgress": number, "zoneStatus": [...], "atRiskTasks": [...], "recommendations": [...] }`;
}
