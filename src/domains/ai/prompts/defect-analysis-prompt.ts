import type { Defect } from "@/domains/quality/model/defect";
import type { TimelineEvent } from "@/domains/timeline/model/timeline-event";
import type { Evidence } from "@/domains/evidence/model/evidence";

export interface DefectAnalysisPromptInput {
  projectId: string;
  spatialNodeId?: string | null;
  defects: Defect[];
  events: TimelineEvent[];
  evidence: Evidence[];
}

export function buildDefectAnalysisPrompt(
  input: DefectAnalysisPromptInput
): string {
  const { projectId, spatialNodeId, defects, events, evidence } = input;

  const defectSummary = defects
    .map(
      (d) =>
        `- [${d.severity.toUpperCase()}] ${d.title} (status: ${d.status}, zone: ${d.spatialNodeId ?? "unassigned"})`
    )
    .join("\n");

  const eventSummary = events
    .map((e) => `- [${e.timestamp.toISOString().split("T")[0]}] ${e.type}: ${e.title}`)
    .join("\n");

  const evidenceSummary = evidence
    .map((ev) => `- ${ev.type}: ${ev.title} (zone: ${ev.spatialNodeId ?? "unassigned"})`)
    .join("\n");

  return `You are an expert construction quality analyst.

Project ID: ${projectId}
${spatialNodeId ? `Spatial Zone: ${spatialNodeId}` : "Scope: entire project"}

## Active Defects (${defects.length})
${defectSummary || "None"}

## Recent Timeline Events (${events.length})
${eventSummary || "None"}

## Evidence Items (${evidence.length})
${evidenceSummary || "None"}

Analyze the defects above. For each defect:
1. Assess root cause likelihood.
2. Rate remediation urgency (immediate / this week / this month).
3. Flag any patterns or systemic issues across zones.

Respond with a structured JSON object containing:
{ "defectAnalysis": [...], "patterns": [...], "urgentActions": [...] }`;
}
