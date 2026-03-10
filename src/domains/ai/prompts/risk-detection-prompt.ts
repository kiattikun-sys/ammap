import type { Defect } from "@/domains/quality/model/defect";
import type { WorkItem } from "@/domains/work/model/work-item";
import type { TimelineEvent } from "@/domains/timeline/model/timeline-event";
import type { Evidence } from "@/domains/evidence/model/evidence";

export interface RiskDetectionPromptInput {
  projectId: string;
  defects: Defect[];
  workItems: WorkItem[];
  events: TimelineEvent[];
  evidence: Evidence[];
}

export function buildRiskDetectionPrompt(
  input: RiskDetectionPromptInput
): string {
  const { projectId, defects, workItems, events, evidence } = input;

  const criticalDefects = defects.filter(
    (d) => d.severity === "critical" || d.severity === "high"
  );
  const blockedTasks = workItems.filter((w) => w.status === "blocked");

  const defectSummary = criticalDefects
    .map((d) => `- [${d.severity.toUpperCase()}] ${d.title} (zone: ${d.spatialNodeId ?? "??"}, status: ${d.status})`)
    .join("\n");

  const blockedSummary = blockedTasks
    .map((w) => `- ${w.title} (zone: ${w.spatialNodeId ?? "??"}, priority: ${w.priority})`)
    .join("\n");

  const recentEvents = events
    .slice(-10)
    .map((e) => `- [${e.type}] ${e.title} @ ${e.timestamp.toISOString().split("T")[0]}`)
    .join("\n");

  const evidenceSummary = evidence
    .map((ev) => `- ${ev.type}: ${ev.title}`)
    .join("\n");

  return `You are an expert construction risk analyst.

Project ID: ${projectId}

## Critical/High Defects (${criticalDefects.length})
${defectSummary || "None"}

## Blocked Tasks (${blockedTasks.length})
${blockedSummary || "None"}

## Recent Events (last 10)
${recentEvents || "None"}

## Evidence (${evidence.length} items)
${evidenceSummary || "None"}

Identify construction risk zones and issues. For each risk:
1. Assign a risk level: critical / high / medium / low.
2. Identify the affected spatial zone(s).
3. Suggest immediate mitigation actions.

Respond with a structured JSON object:
{ "risks": [{ "level": string, "zone": string, "description": string, "mitigation": string }], "summary": string }`;
}
