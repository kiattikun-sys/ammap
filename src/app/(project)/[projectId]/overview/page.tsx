import { getProjectByIdServer } from "@/domains/project/queries/get-project-server";
import { getWorkItemProgressStatsServer, getWorkItemStatusCountsServer, getDefectStatusCountsServer, getTableCountServer } from "@/domains/dashboard/queries/dashboard-aggregations-server";
import { listTimelineEventsServer } from "@/domains/timeline/queries/list-timeline-events-server";
import { notFound } from "next/navigation";

interface Props {
  params: { projectId: string };
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${color ?? "text-slate-900"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{children}</h2>;
}

export default async function ProjectOverviewPage({ params }: Props) {
  const { projectId } = params;

  const project = await getProjectByIdServer(projectId);
  if (!project) notFound();

  const projectIds = [projectId];

  const [progressStats, statusCounts, defectCounts, evidenceCount, timelineCount, recentEvents] =
    await Promise.all([
      getWorkItemProgressStatsServer(projectIds),
      getWorkItemStatusCountsServer(projectIds),
      getDefectStatusCountsServer(projectIds),
      getTableCountServer("evidence", projectIds),
      getTableCountServer("timeline_events", projectIds),
      listTimelineEventsServer({ projectId, limit: 8 }),
    ]);

  const completionBarWidth = `${progressStats.completionRate}%`;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
        {project.description && (
          <p className="mt-1 text-sm text-slate-500">{project.description}</p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            project.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-500"
          }`}>
            {project.status}
          </span>
          <span className="text-xs text-slate-400">
            Created {project.createdAt.toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Tasks" value={progressStats.totalTasks} />
        <StatCard
          label="Completion"
          value={`${progressStats.completionRate}%`}
          sub={`${progressStats.completedTasks} of ${progressStats.totalTasks} completed`}
          color="text-blue-600"
        />
        <StatCard
          label="Open Defects"
          value={defectCounts.openDefects}
          sub={defectCounts.criticalDefects > 0 ? `${defectCounts.criticalDefects} critical` : undefined}
          color={defectCounts.criticalDefects > 0 ? "text-red-600" : "text-slate-900"}
        />
        <StatCard
          label="Overdue Tasks"
          value={progressStats.overdueTasks}
          color={progressStats.overdueTasks > 0 ? "text-amber-600" : "text-slate-900"}
        />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <SectionTitle>Overall Progress</SectionTitle>
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: completionBarWidth }}
            />
          </div>
          <span className="text-sm font-semibold text-slate-700">{progressStats.completionRate}%</span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
          {(["planned", "in_progress", "blocked", "completed"] as const).map((s) => (
            <div key={s} className="rounded-lg bg-slate-50 px-2 py-2">
              <p className="text-base font-bold text-slate-800">{statusCounts[s]}</p>
              <p className="capitalize text-slate-500">{s.replace("_", " ")}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <SectionTitle>Evidence & Activity</SectionTitle>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Evidence files</span>
              <span className="font-semibold text-slate-800">{evidenceCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Timeline events</span>
              <span className="font-semibold text-slate-800">{timelineCount}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <SectionTitle>Task Status</SectionTitle>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Planned</span>
              <span className="font-medium text-slate-700">{statusCounts.planned}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">In Progress</span>
              <span className="font-medium text-blue-600">{statusCounts.in_progress}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Blocked</span>
              <span className="font-medium text-red-500">{statusCounts.blocked}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Completed</span>
              <span className="font-medium text-green-600">{statusCounts.completed}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <SectionTitle>Recent Activity</SectionTitle>
        {recentEvents.length === 0 ? (
          <p className="text-sm text-slate-400">No activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentEvents.map((event) => (
              <li key={event.id} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400 mt-2" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-slate-800">{event.title}</p>
                  <p className="text-xs text-slate-400">
                    {event.timestamp.toLocaleDateString()} · {event.type.replace(/_/g, " ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
