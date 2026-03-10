import type { AIAnalysis, AIAnalysisType } from "../model/ai-analysis";
import type { AIReport, AIReportType } from "../model/ai-report";
import { listDefects } from "@/domains/quality/queries/list-defects";
import { listWorkItems } from "@/domains/work/queries/list-work-items";
import { listEvidence } from "@/domains/evidence/queries/list-evidence";
import { listTimelineEvents } from "@/domains/timeline/queries/list-timeline-events";
import { listProgressRecords } from "@/domains/timeline/queries/list-progress-records";
import {
  buildDefectAnalysisPrompt,
} from "../prompts/defect-analysis-prompt";
import {
  buildProgressSummaryPrompt,
} from "../prompts/progress-summary-prompt";
import {
  buildRiskDetectionPrompt,
} from "../prompts/risk-detection-prompt";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o";

async function callOpenAI(prompt: string): Promise<string> {
  const apiKey =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_OPENAI_API_KEY
      : undefined;

  if (!apiKey) {
    console.warn("[AIService] NEXT_PUBLIC_OPENAI_API_KEY not set — returning stub response.");
    return JSON.stringify({
      stub: true,
      message: "AI analysis stub — set NEXT_PUBLIC_OPENAI_API_KEY to enable real analysis.",
      promptLength: prompt.length,
    });
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${error}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0]?.message?.content ?? "{}";
}

function makeAnalysis(
  projectId: string,
  analysisType: AIAnalysisType,
  inputSummary: string,
  result: string,
  spatialNodeId: string | null = null
): AIAnalysis {
  return {
    id: crypto.randomUUID(),
    projectId,
    spatialNodeId,
    analysisType,
    inputSummary,
    result,
    confidence: 0.85,
    createdAt: new Date(),
  };
}

function makeReport(
  projectId: string,
  title: string,
  type: AIReportType,
  content: string
): AIReport {
  return {
    id: crypto.randomUUID(),
    projectId,
    title,
    type,
    generatedBy: OPENAI_MODEL,
    content,
    createdAt: new Date(),
  };
}

export class AIService {
  async analyzeDefects(projectId: string): Promise<AIAnalysis> {
    const [defects, events, evidence] = await Promise.all([
      listDefects({ projectId }),
      listTimelineEvents({ projectId }),
      listEvidence({ projectId }),
    ]);

    const prompt = buildDefectAnalysisPrompt({
      projectId,
      defects,
      events,
      evidence,
    });

    const result = await callOpenAI(prompt);
    const summary = `${defects.length} defects, ${events.length} events, ${evidence.length} evidence items`;

    return makeAnalysis(projectId, "defect_analysis", summary, result);
  }

  async generateProgressReport(projectId: string): Promise<AIReport> {
    const [workItems, progressRecords, events] = await Promise.all([
      listWorkItems({ projectId }),
      listProgressRecords({ projectId }),
      listTimelineEvents({ projectId }),
    ]);

    const prompt = buildProgressSummaryPrompt({
      projectId,
      workItems,
      progressRecords,
      events,
    });

    const content = await callOpenAI(prompt);

    return makeReport(
      projectId,
      `Progress Report — ${new Date().toISOString().split("T")[0]}`,
      "progress_report",
      content
    );
  }

  async detectRiskZones(projectId: string): Promise<AIAnalysis> {
    const [defects, workItems, events, evidence] = await Promise.all([
      listDefects({ projectId }),
      listWorkItems({ projectId }),
      listTimelineEvents({ projectId }),
      listEvidence({ projectId }),
    ]);

    const prompt = buildRiskDetectionPrompt({
      projectId,
      defects,
      workItems,
      events,
      evidence,
    });

    const result = await callOpenAI(prompt);
    const summary = `${defects.length} defects, ${workItems.length} tasks, ${events.length} events`;

    return makeAnalysis(projectId, "risk_detection", summary, result);
  }
}

export const aiService = new AIService();
