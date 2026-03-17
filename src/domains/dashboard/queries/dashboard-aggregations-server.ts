import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { WorkStatus } from "@/domains/work/model/work-item";
import type { DefectSeverity } from "@/domains/quality/model/defect";
import type {
  WorkItemStatusCounts,
  WorkItemProgressStats,
  DefectStatusCounts,
  DefectSeverityCounts,
  RiskZoneRow,
} from "./dashboard-aggregations";

type StatusRow = { status: string };
type SeverityRow = { severity: string };
type StatusSeverityRow = { status: string; severity: string };
type ZoneDefectRow = { spatial_node_id: string; severity: string };
type ProgressRow = { progress: number; status: string; due_date: string | null };
type IdRow = { id: string };

export async function getWorkItemStatusCountsServer(
  projectIds: string[]
): Promise<WorkItemStatusCounts> {
  const zero: WorkItemStatusCounts = {
    planned: 0, in_progress: 0, blocked: 0, completed: 0,
  };
  if (projectIds.length === 0) return zero;

  const db = (await createSupabaseServer()) as any;
  const { data, error } = await db
    .from("work_items")
    .select("status")
    .in("project_id", projectIds);

  if (error) throw new Error(`getWorkItemStatusCountsServer: ${error.message}`);
  const result = { ...zero };
  for (const row of (data ?? []) as StatusRow[]) {
    const s = row.status as WorkStatus;
    if (s in result) result[s]++;
  }
  return result;
}

export async function getWorkItemProgressStatsServer(
  projectIds: string[]
): Promise<WorkItemProgressStats> {
  if (projectIds.length === 0) {
    return { totalTasks: 0, completedTasks: 0, overallProgress: 0, overdueTasks: 0, completionRate: 0 };
  }

  const db = (await createSupabaseServer()) as any;
  const { data, error } = await db
    .from("work_items")
    .select("progress, status, due_date")
    .in("project_id", projectIds);

  if (error) throw new Error(`getWorkItemProgressStatsServer: ${error.message}`);

  const rows = (data ?? []) as ProgressRow[];
  const now = new Date();
  const totalTasks = rows.length;
  const completedTasks = rows.filter((r) => r.status === "completed").length;
  const overallProgress = totalTasks > 0
    ? Math.round(rows.reduce((sum, r) => sum + (r.progress ?? 0), 0) / totalTasks)
    : 0;
  const overdueTasks = rows.filter(
    (r) => r.status !== "completed" && r.due_date && new Date(r.due_date) < now
  ).length;
  const completionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  return { totalTasks, completedTasks, overallProgress, overdueTasks, completionRate };
}

export async function getDefectStatusCountsServer(
  projectIds: string[]
): Promise<DefectStatusCounts> {
  if (projectIds.length === 0) return { openDefects: 0, criticalDefects: 0 };

  const db = (await createSupabaseServer()) as any;
  const { data, error } = await db
    .from("defects")
    .select("status, severity")
    .in("project_id", projectIds);

  if (error) throw new Error(`getDefectStatusCountsServer: ${error.message}`);

  let openDefects = 0;
  let criticalDefects = 0;
  for (const row of (data ?? []) as StatusSeverityRow[]) {
    if (row.status === "open" || row.status === "in_progress") openDefects++;
    if (row.severity === "critical" && row.status !== "closed") criticalDefects++;
  }
  return { openDefects, criticalDefects };
}

export async function getDefectSeverityCountsServer(
  projectIds: string[]
): Promise<DefectSeverityCounts> {
  const zero: DefectSeverityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
  if (projectIds.length === 0) return zero;

  const db = (await createSupabaseServer()) as any;
  const { data, error } = await db
    .from("defects")
    .select("severity")
    .in("project_id", projectIds);

  if (error) throw new Error(`getDefectSeverityCountsServer: ${error.message}`);

  const result = { ...zero };
  for (const row of (data ?? []) as SeverityRow[]) {
    const s = row.severity as DefectSeverity;
    if (s in result) result[s]++;
  }
  return result;
}

export async function getRiskZoneRowsServer(
  projectIds: string[]
): Promise<RiskZoneRow[]> {
  if (projectIds.length === 0) return [];

  const db = (await createSupabaseServer()) as any;
  const { data, error } = await db
    .from("defects")
    .select("spatial_node_id, severity")
    .in("project_id", projectIds)
    .not("spatial_node_id", "is", null)
    .in("severity", ["critical", "high"]);

  if (error) throw new Error(`getRiskZoneRowsServer: ${error.message}`);

  const zoneMap = new Map<string, RiskZoneRow>();
  for (const row of (data ?? []) as ZoneDefectRow[]) {
    const zoneId = row.spatial_node_id;
    const existing = zoneMap.get(zoneId) ?? {
      zoneId, defectCount: 0, hasCritical: false, hasHigh: false,
    };
    existing.defectCount++;
    if (row.severity === "critical") existing.hasCritical = true;
    if (row.severity === "high") existing.hasHigh = true;
    zoneMap.set(zoneId, existing);
  }
  return Array.from(zoneMap.values());
}

export async function getTableCountServer(
  table: "evidence" | "timeline_events" | "spatial_nodes",
  projectIds: string[],
  extraFilters?: { column: string; value: string }
): Promise<number> {
  if (projectIds.length === 0) return 0;

  const db = (await createSupabaseServer()) as any;
  let query = db
    .from(table)
    .select("id")
    .in("project_id", projectIds);

  if (extraFilters) {
    query = query.eq(extraFilters.column, extraFilters.value);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getTableCountServer(${table}): ${error.message}`);

  return (data as IdRow[])?.length ?? 0;
}
