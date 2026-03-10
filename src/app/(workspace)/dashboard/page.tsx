"use client";

import { DashboardController } from "@/features/dashboard/dashboard-controller";
import {
  ProjectHealthCard,
  ProgressChart,
  DefectSummaryCard,
  RiskZonesCard,
  MetricsSummary,
} from "@/features/dashboard/components";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { useFirstProject } from "@/features/projects/hooks/use-first-project";
import Link from "next/link";

export default function WorkspaceDashboardPage() {
  const { projectId, loading: projectLoading } = useFirstProject();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Project Intelligence Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time construction health and risk overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            All Projects
          </Link>
          <SignOutButton />
        </div>
      </div>

      {projectLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm text-slate-400">Loading…</div>
        </div>
      ) : !projectId ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
          <p className="text-sm font-medium text-slate-600">No projects yet</p>
          <p className="mt-1 text-xs text-slate-400">Create your first project to see dashboard metrics</p>
          <Link
            href="/projects"
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <DashboardController projectId={projectId}>
          {({ health, metrics, riskSummary, loading, error }) => {
            if (loading) {
              return (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-sm text-slate-400">Loading dashboard data…</div>
                </div>
              );
            }

            if (error) {
              return (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  Error: {error}
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {metrics && <MetricsSummary metrics={metrics} />}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {health && <ProjectHealthCard health={health} />}
                  {metrics && <ProgressChart metrics={metrics} />}
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {metrics && <DefectSummaryCard metrics={metrics} />}
                  <RiskZonesCard riskSummary={riskSummary} />
                </div>
              </div>
            );
          }}
        </DashboardController>
      )}
    </div>
  );
}
