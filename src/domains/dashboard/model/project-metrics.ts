import type { WorkStatus } from "@/domains/work/model/work-item";
import type { DefectSeverity } from "@/domains/quality/model/defect";

export interface ProjectMetrics {
  projectId: string;
  tasksByStatus: Record<WorkStatus, number>;
  defectsBySeverity: Record<DefectSeverity, number>;
  evidenceCount: number;
  timelineEvents: number;
  zonesActive: number;
  overdueTasks: number;
  completionRate: number;
  tasksByZone: Record<string, number>;
}
