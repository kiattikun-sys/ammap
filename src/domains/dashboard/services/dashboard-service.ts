import type { ProjectHealth } from "../model/project-health";
import type { ProjectMetrics } from "../model/project-metrics";
import { listWorkItems } from "@/domains/work/queries/list-work-items";
import { listDefects } from "@/domains/quality/queries/list-defects";
import { listEvidence } from "@/domains/evidence/queries/list-evidence";
import { listTimelineEvents } from "@/domains/timeline/queries/list-timeline-events";
import { listSpatialNodes } from "@/domains/spatial/queries/list-spatial-nodes";
import type { WorkItem, WorkStatus } from "@/domains/work/model/work-item";
import type { Defect, DefectSeverity } from "@/domains/quality/model/defect";

export class DashboardService {
  async getProjectHealth(projectId: string): Promise<ProjectHealth> {
    const [tasks, defects] = await Promise.all([
      listWorkItems({ projectId }),
      listDefects({ projectId }),
    ]);

    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const totalProgress =
      tasks.length > 0
        ? Math.round(
            tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length
          )
        : 0;

    const openDefects = defects.filter(
      (d) => d.status === "open" || d.status === "in_progress"
    ).length;
    const criticalDefects = defects.filter(
      (d) => d.severity === "critical" && d.status !== "closed"
    ).length;

    const riskZones = [
      ...new Set(
        defects
          .filter((d) => d.severity === "critical" || d.severity === "high")
          .map((d) => d.spatialNodeId)
          .filter((id): id is string => id !== null)
      ),
    ];

    return {
      projectId,
      overallProgress: totalProgress,
      totalTasks: tasks.length,
      completedTasks,
      openDefects,
      criticalDefects,
      riskZones,
      lastUpdated: new Date(),
    };
  }

  async getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
    const [tasks, defects, evidence, events, zones] = await Promise.all([
      listWorkItems({ projectId }),
      listDefects({ projectId }),
      listEvidence({ projectId }),
      listTimelineEvents({ projectId }),
      listSpatialNodes({ projectId, type: "zone" }),
    ]);

    const tasksByStatus: Record<WorkStatus, number> = {
      planned: 0,
      in_progress: 0,
      blocked: 0,
      completed: 0,
    };
    for (const t of tasks) {
      tasksByStatus[t.status] = (tasksByStatus[t.status] ?? 0) + 1;
    }

    const defectsBySeverity: Record<DefectSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    for (const d of defects) {
      defectsBySeverity[d.severity] = (defectsBySeverity[d.severity] ?? 0) + 1;
    }

    const now = new Date();
    const overdueTasks = tasks.filter(
      (t) => t.status !== "completed" && t.dueDate && t.dueDate < now
    ).length;

    const completionRate =
      tasks.length > 0
        ? Math.round((tasks.filter((t) => t.status === "completed").length / tasks.length) * 100)
        : 0;

    const tasksByZone: Record<string, number> = {};
    for (const t of tasks) {
      if (t.spatialNodeId) {
        tasksByZone[t.spatialNodeId] = (tasksByZone[t.spatialNodeId] ?? 0) + 1;
      }
    }

    return {
      projectId,
      tasksByStatus,
      defectsBySeverity,
      evidenceCount: evidence.length,
      timelineEvents: events.length,
      zonesActive: zones.length,
      overdueTasks,
      completionRate,
      tasksByZone,
    };
  }

  async getRiskSummary(
    projectId: string
  ): Promise<{ zoneId: string; defectCount: number; severity: string }[]> {
    const defects = await listDefects({ projectId });

    const zoneMap = new Map<
      string,
      { defectCount: number; hasCritical: boolean; hasHigh: boolean }
    >();

    for (const d of defects) {
      if (!d.spatialNodeId) continue;
      const existing = zoneMap.get(d.spatialNodeId) ?? {
        defectCount: 0,
        hasCritical: false,
        hasHigh: false,
      };
      existing.defectCount++;
      if (d.severity === "critical") existing.hasCritical = true;
      if (d.severity === "high") existing.hasHigh = true;
      zoneMap.set(d.spatialNodeId, existing);
    }

    return Array.from(zoneMap.entries()).map(([zoneId, data]) => ({
      zoneId,
      defectCount: data.defectCount,
      severity: data.hasCritical ? "critical" : data.hasHigh ? "high" : "medium",
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

    const results = await Promise.all(
      projectIds.map((id) =>
        Promise.all([listWorkItems({ projectId: id }), listDefects({ projectId: id })])
      )
    );

    const allTasks: WorkItem[] = results.flatMap(([tasks]) => tasks);
    const allDefects: Defect[] = results.flatMap(([, defects]) => defects);

    const completedTasks = allTasks.filter((t) => t.status === "completed").length;
    const totalProgress =
      allTasks.length > 0
        ? Math.round(allTasks.reduce((sum, t) => sum + t.progress, 0) / allTasks.length)
        : 0;

    const openDefects = allDefects.filter(
      (d) => d.status === "open" || d.status === "in_progress"
    ).length;
    const criticalDefects = allDefects.filter(
      (d) => d.severity === "critical" && d.status !== "closed"
    ).length;
    const riskZones = [
      ...new Set(
        allDefects
          .filter((d) => d.severity === "critical" || d.severity === "high")
          .map((d) => d.spatialNodeId)
          .filter((id): id is string => id !== null)
      ),
    ];

    return {
      projectId: "org",
      overallProgress: totalProgress,
      totalTasks: allTasks.length,
      completedTasks,
      openDefects,
      criticalDefects,
      riskZones,
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

    const results = await Promise.all(
      projectIds.map((id) =>
        Promise.all([
          listWorkItems({ projectId: id }),
          listDefects({ projectId: id }),
          listEvidence({ projectId: id }),
          listTimelineEvents({ projectId: id }),
          listSpatialNodes({ projectId: id, type: "zone" }),
        ])
      )
    );

    const allTasks: WorkItem[] = results.flatMap(([tasks]) => tasks);
    const allDefects: Defect[] = results.flatMap(([, defects]) => defects);
    const totalEvidence = results.reduce((s, [, , ev]) => s + ev.length, 0);
    const totalEvents = results.reduce((s, [, , , ev]) => s + ev.length, 0);
    const totalZones = results.reduce((s, [, , , , z]) => s + z.length, 0);

    const tasksByStatus: Record<WorkStatus, number> = {
      planned: 0,
      in_progress: 0,
      blocked: 0,
      completed: 0,
    };
    for (const t of allTasks) {
      tasksByStatus[t.status] = (tasksByStatus[t.status] ?? 0) + 1;
    }

    const defectsBySeverity: Record<DefectSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    for (const d of allDefects) {
      defectsBySeverity[d.severity] = (defectsBySeverity[d.severity] ?? 0) + 1;
    }

    const now = new Date();
    const overdueTasks = allTasks.filter(
      (t) => t.status !== "completed" && t.dueDate && t.dueDate < now
    ).length;

    const completionRate =
      allTasks.length > 0
        ? Math.round(
            (allTasks.filter((t) => t.status === "completed").length / allTasks.length) * 100
          )
        : 0;

    const tasksByZone: Record<string, number> = {};
    for (const t of allTasks) {
      if (t.spatialNodeId) {
        tasksByZone[t.spatialNodeId] = (tasksByZone[t.spatialNodeId] ?? 0) + 1;
      }
    }

    return {
      projectId: "org",
      tasksByStatus,
      defectsBySeverity,
      evidenceCount: totalEvidence,
      timelineEvents: totalEvents,
      zonesActive: totalZones,
      overdueTasks,
      completionRate,
      tasksByZone,
    };
  }

  async getOrgRiskSummary(
    projectIds: string[]
  ): Promise<{ zoneId: string; defectCount: number; severity: string }[]> {
    if (projectIds.length === 0) return [];

    const allDefects: Defect[] = (
      await Promise.all(projectIds.map((id) => listDefects({ projectId: id })))
    ).flat();

    const zoneMap = new Map<
      string,
      { defectCount: number; hasCritical: boolean; hasHigh: boolean }
    >();

    for (const d of allDefects) {
      if (!d.spatialNodeId) continue;
      const existing = zoneMap.get(d.spatialNodeId) ?? {
        defectCount: 0,
        hasCritical: false,
        hasHigh: false,
      };
      existing.defectCount++;
      if (d.severity === "critical") existing.hasCritical = true;
      if (d.severity === "high") existing.hasHigh = true;
      zoneMap.set(d.spatialNodeId, existing);
    }

    return Array.from(zoneMap.entries()).map(([zoneId, data]) => ({
      zoneId,
      defectCount: data.defectCount,
      severity: data.hasCritical ? "critical" : data.hasHigh ? "high" : "medium",
    }));
  }
}

export const dashboardService = new DashboardService();
