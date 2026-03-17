import { getProjectByIdServer } from "@/domains/project/queries/get-project-server";
import { getWorkItemProgressStatsServer, getWorkItemStatusCountsServer, getDefectStatusCountsServer, getDefectSeverityCountsServer, getTableCountServer } from "@/domains/dashboard/queries/dashboard-aggregations-server";
import { notFound } from "next/navigation";

interface Props {
  params: { projectId: string };
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={`font-semibold ${highlight ? "text-red-600" : "text-slate-800"}`}>{value}</span>
    </div>
  );
}

export default async function ProjectReportsPage({ params }: Props) {
  const { projectId } = params;
  const project = await getProjectByIdServer(projectId);
  if (!project) notFound();

  const projectIds = [projectId];
  const [progressStats, statusCounts, defectStatus, defectSeverity, evidenceCount, timelineCount] =
    await Promise.all([
      getWorkItemProgressStatsServer(projectIds),
      getWorkItemStatusCountsServer(projectIds),
      getDefectStatusCountsServer(projectIds),
      getDefectSeverityCountsServer(projectIds),
      getTableCountServer("evidence", projectIds),
      getTableCountServer("timeline_events", projectIds),
    ]);

  const generatedAt = new Date().toLocaleString();

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Project Report</h1>
          <p className="mt-1 text-sm text-slate-500">{project.name}</p>
        </div>
        <span className="text-xs text-slate-400">Generated: {generatedAt}</span>
      </div>

      <div className="space-y-4 max-w-2xl">
        <ReportSection title="Work Items Summary">
          <Row label="Total Tasks" value={progressStats.totalTasks} />
          <Row label="Completed" value={statusCounts.completed} />
          <Row label="In Progress" value={statusCounts.in_progress} />
          <Row label="Planned" value={statusCounts.planned} />
          <Row label="Blocked" value={statusCounts.blocked} highlight={statusCounts.blocked > 0} />
          <Row label="Overdue" value={progressStats.overdueTasks} highlight={progressStats.overdueTasks > 0} />
          <Row label="Completion Rate" value={`${progressStats.completionRate}%`} />
          <Row label="Overall Progress" value={`${progressStats.overallProgress}%`} />
        </ReportSection>

        <ReportSection title="Defects Summary">
          <Row label="Open Defects" value={defectStatus.openDefects} highlight={defectStatus.openDefects > 0} />
          <Row label="Critical Defects" value={defectStatus.criticalDefects} highlight={defectStatus.criticalDefects > 0} />
          <Row label="Low Severity" value={defectSeverity.low} />
          <Row label="Medium Severity" value={defectSeverity.medium} />
          <Row label="High Severity" value={defectSeverity.high} highlight={defectSeverity.high > 0} />
          <Row label="Critical Severity" value={defectSeverity.critical} highlight={defectSeverity.critical > 0} />
        </ReportSection>

        <ReportSection title="Evidence & Audit">
          <Row label="Evidence Files" value={evidenceCount} />
          <Row label="Timeline Events" value={timelineCount} />
          <Row label="Project Created" value={project.createdAt.toLocaleDateString("en-CA")} />
          <Row label="Last Updated" value={project.updatedAt.toLocaleDateString("en-CA")} />
          <Row label="Status" value={project.status} />
        </ReportSection>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-400 text-center">
          This report reflects live data at the time of page load. Export functionality is planned for a future release.
        </div>
      </div>
    </div>
  );
}
