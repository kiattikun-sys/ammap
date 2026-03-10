export type AIReportType =
  | "defect_report"
  | "progress_report"
  | "risk_report";

export interface AIReport {
  id: string;
  projectId: string;
  title: string;
  type: AIReportType;
  generatedBy: string;
  content: string;
  createdAt: Date;
}
