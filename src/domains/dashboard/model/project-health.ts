export interface ProjectHealth {
  projectId: string;
  overallProgress: number;
  totalTasks: number;
  completedTasks: number;
  openDefects: number;
  criticalDefects: number;
  riskZones: string[];
  lastUpdated: Date;
}
