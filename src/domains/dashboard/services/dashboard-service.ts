import type { ProjectHealth } from "../model/project-health";
import type { ProjectMetrics } from "../model/project-metrics";
import { listSpatialNodes } from "@/domains/spatial/queries/list-spatial-nodes";
import {
  getWorkItemStatusCounts,
  getWorkItemProgressStats,
  getDefectStatusCounts,
  getDefectSeverityCounts,
  getRiskZoneRows,
  getTableCount,
  getWorkItemsByZone,
} from "../queries/dashboard-aggregations";

export class DashboardService {
  async getProjectHealth(projectId: string): Promise<ProjectHealth> {
    const projectIds = [projectId];
    const [progressStats, defectCounts, riskZoneRows] = await Promise.all([
      getWorkItemProgressStats(projectIds),
      getDefectStatusCounts(projectIds),
      getRiskZoneRows(projectIds),
    ]);

    return {
      projectId,
      overallProgress: progressStats.overallProgress,
      totalTasks: progressStats.totalTasks,
      completedTasks: progressStats.completedTasks,
      openDefects: defectCounts.openDefects,
      criticalDefects: defectCounts.criticalDefects,
      riskZones: riskZoneRows.map((r) => r.zoneId),
      lastUpdated: new Date(),
    };
  }

  async getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
    const projectIds = [projectId];
    const [
      tasksByStatus,
      defectsBySeverity,
      progressStats,
      evidenceCount,
      timelineEvents,
      zonesActive,
      tasksByZone,
    ] = await Promise.all([
      getWorkItemStatusCounts(projectIds),
      getDefectSeverityCounts(projectIds),
      getWorkItemProgressStats(projectIds),
      getTableCount("evidence", projectIds),
      getTableCount("timeline_events", projectIds),
      getTableCount("spatial_nodes", projectIds, { column: "type", value: "zone" }),
      getWorkItemsByZone(projectIds),
    ]);

    return {
      projectId,
      tasksByStatus,
      defectsBySeverity,
      evidenceCount,
      timelineEvents,
      zonesActive,
      overdueTasks: progressStats.overdueTasks,
      completionRate: progressStats.completionRate,
      tasksByZone,
    };
  }

  async getRiskSummary(
    projectId: string
  ): Promise<{ zoneId: string; zoneName: string; defectCount: number; severity: string }[]> {
    const [riskZoneRows, spatialNodes] = await Promise.all([
      getRiskZoneRows([projectId]),
      listSpatialNodes({ projectId }),
    ]);

    const nodeNameMap = new Map<string, string>(
      spatialNodes.map((n) => [n.id, n.name])
    );

    return riskZoneRows.map((row) => ({
      zoneId: row.zoneId,
      zoneName: nodeNameMap.get(row.zoneId) ?? row.zoneId,
      defectCount: row.defectCount,
      severity: row.hasCritical ? "critical" : row.hasHigh ? "high" : "medium",
    }));
  }

  async getOrgHealth(projectIds: string[]): Promise<ProjectHealth> {
    if (projectIds.length === 0) {
      return {
        projectId: "org",
        overallProgress: 0,
        totalTasks: 0,
        completedTasks: 0,
        openDefects: 0,
        criticalDefects: 0,
        riskZones: [],
        lastUpdated: new Date(),
      };
    }

    const [progressStats, defectCounts, riskZoneRows] = await Promise.all([
      getWorkItemProgressStats(projectIds),
      getDefectStatusCounts(projectIds),
      getRiskZoneRows(projectIds),
    ]);

    return {
      projectId: "org",
      overallProgress: progressStats.overallProgress,
      totalTasks: progressStats.totalTasks,
      completedTasks: progressStats.completedTasks,
      openDefects: defectCounts.openDefects,
      criticalDefects: defectCounts.criticalDefects,
      riskZones: riskZoneRows.map((r) => r.zoneId),
      lastUpdated: new Date(),
    };
  }

  async getOrgMetrics(projectIds: string[]): Promise<ProjectMetrics> {
    if (projectIds.length === 0) {
      return {
        projectId: "org",
        tasksByStatus: { planned: 0, in_progress: 0, blocked: 0, completed: 0 },
        defectsBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        evidenceCount: 0,
        timelineEvents: 0,
        zonesActive: 0,
        overdueTasks: 0,
        completionRate: 0,
        tasksByZone: {},
      };
    }

    const [
      tasksByStatus,
      defectsBySeverity,
      progressStats,
      evidenceCount,
      timelineEvents,
      zonesActive,
      tasksByZone,
    ] = await Promise.all([
      getWorkItemStatusCounts(projectIds),
      getDefectSeverityCounts(projectIds),
      getWorkItemProgressStats(projectIds),
      getTableCount("evidence", projectIds),
      getTableCount("timeline_events", projectIds),
      getTableCount("spatial_nodes", projectIds, { column: "type", value: "zone" }),
      getWorkItemsByZone(projectIds),
    ]);

    return {
      projectId: "org",
      tasksByStatus,
      defectsBySeverity,
      evidenceCount,
      timelineEvents,
      zonesActive,
      overdueTasks: progressStats.overdueTasks,
      completionRate: progressStats.completionRate,
      tasksByZone,
    };
  }

  async getOrgRiskSummary(
    projectIds: string[]
  ): Promise<{ zoneId: string; zoneName: string; defectCount: number; severity: string }[]> {
    if (projectIds.length === 0) return [];

    const [riskZoneRows, allNodes] = await Promise.all([
      getRiskZoneRows(projectIds),
      Promise.all(projectIds.map((id) => listSpatialNodes({ projectId: id }))).then((r) => r.flat()),
    ]);

    const nodeNameMap = new Map<string, string>(
      allNodes.map((n) => [n.id, n.name])
    );

    return riskZoneRows.map((row) => ({
      zoneId: row.zoneId,
      zoneName: nodeNameMap.get(row.zoneId) ?? row.zoneId,
      defectCount: row.defectCount,
      severity: row.hasCritical ? "critical" : row.hasHigh ? "high" : "medium",
    }));
  }
}

export const dashboardService = new DashboardService();
