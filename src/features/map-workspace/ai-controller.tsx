"use client";

import { useEffect, useCallback } from "react";
import { aiService } from "@/domains/ai/services/ai-service";

interface AIControllerProps {
  projectId: string;
}

export function AIController({ projectId }: AIControllerProps) {
  const runAnalysis = useCallback(async () => {
    console.log("[AIController] Starting AI analysis for project:", projectId);

    try {
      const [defectAnalysis, progressReport, riskAnalysis] = await Promise.all([
        aiService.analyzeDefects(projectId),
        aiService.generateProgressReport(projectId),
        aiService.detectRiskZones(projectId),
      ]);

      console.log("AI Analysis Result:", {
        defectAnalysis: {
          id: defectAnalysis.id,
          type: defectAnalysis.analysisType,
          inputSummary: defectAnalysis.inputSummary,
          confidence: defectAnalysis.confidence,
          result: JSON.parse(defectAnalysis.result),
        },
        progressReport: {
          id: progressReport.id,
          title: progressReport.title,
          type: progressReport.type,
          content: JSON.parse(progressReport.content),
        },
        riskAnalysis: {
          id: riskAnalysis.id,
          type: riskAnalysis.analysisType,
          inputSummary: riskAnalysis.inputSummary,
          confidence: riskAnalysis.confidence,
          result: JSON.parse(riskAnalysis.result),
        },
      });
    } catch (err) {
      console.error("[AIController] Analysis failed:", err);
    }
  }, [projectId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as Record<string, unknown>;
    w.__runAIAnalysis = runAnalysis;
    return () => {
      delete w.__runAIAnalysis;
    };
  }, [runAnalysis]);

  return null;
}
