export type AIAnalysisType =
  | "defect_analysis"
  | "progress_summary"
  | "risk_detection";

export interface AIAnalysis {
  id: string;
  projectId: string;
  spatialNodeId: string | null;
  analysisType: AIAnalysisType;
  inputSummary: string;
  result: string;
  confidence: number;
  createdAt: Date;
}
