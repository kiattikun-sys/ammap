import { getProjectByIdServer } from "@/domains/project/queries/get-project-server";
import { getWorkItemProgressStatsServer, getDefectStatusCountsServer } from "@/domains/dashboard/queries/dashboard-aggregations-server";
import { notFound } from "next/navigation";

interface Props {
  params: { projectId: string };
}

export default async function ProjectAiPage({ params }: Props) {
  const { projectId } = params;
  const project = await getProjectByIdServer(projectId);
  if (!project) notFound();

  const projectIds = [projectId];
  const [progressStats, defectCounts] = await Promise.all([
    getWorkItemProgressStatsServer(projectIds),
    getDefectStatusCountsServer(projectIds),
  ]);

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">AI Assistant</h1>
        <p className="mt-1 text-sm text-slate-500">{project.name}</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{progressStats.totalTasks}</p>
          <p className="mt-0.5 text-xs text-slate-500">Total Tasks</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{progressStats.completionRate}%</p>
          <p className="mt-0.5 text-xs text-slate-500">Completion</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className={`text-2xl font-bold ${defectCounts.criticalDefects > 0 ? "text-red-600" : "text-slate-800"}`}>
            {defectCounts.openDefects}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Open Defects</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <svg className="h-7 w-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.402 2.798H4.2c-1.432 0-2.401-1.798-1.402-2.798L4.6 15.3" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-slate-800">AI-Powered Project Intelligence</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          Intelligent analysis of your project data — defect pattern detection, risk prediction,
          and natural language Q&amp;A about your construction project — is under development.
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          Coming in a future release
        </div>
      </div>
    </div>
  );
}
