"use client";

import type { WorkItem, WorkStatus } from "@/domains/work/model/work-item";
import { cn } from "@/lib/cn";

interface ProgressPageClientProps {
  projectId: string;
  items: WorkItem[];
}

const STATUS_ORDER: WorkStatus[] = ["planned", "in_progress", "blocked", "completed"];

const STATUS_COLORS: Record<WorkStatus, string> = {
  planned: "bg-slate-200",
  in_progress: "bg-blue-400",
  blocked: "bg-red-400",
  completed: "bg-green-500",
};

const STATUS_LABELS: Record<WorkStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  blocked: "Blocked",
  completed: "Completed",
};

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function ProgressPageClient({ items }: ProgressPageClientProps) {
  const total = items.length;
  const overallProgress = avg(items.map((i) => i.progressPercent));

  const byStatus = STATUS_ORDER.reduce<Record<WorkStatus, WorkItem[]>>(
    (acc, s) => {
      acc[s] = items.filter((i) => i.status === s);
      return acc;
    },
    { planned: [], in_progress: [], blocked: [], completed: [] }
  );

  const completedCount = byStatus.completed.length;
  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-slate-800">Progress</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {total} work item{total !== 1 ? "s" : ""} tracked
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Overall summary */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATUS_ORDER.map((status) => {
            const count = byStatus[status].length;
            return (
              <div
                key={status}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {STATUS_LABELS[status]}
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-800">{count}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {total > 0 ? Math.round((count / total) * 100) : 0}% of total
                </p>
              </div>
            );
          })}
        </div>

        {/* Overall progress bar */}
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Overall Progress</p>
            <span className="text-sm font-bold text-slate-800">{overallProgress}%</span>
          </div>
          <div className="mt-3 h-3 w-full rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-blue-500 transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {completedCount} of {total} items completed ({completionRate}% completion rate)
          </p>
        </div>

        {/* Per-item breakdown */}
        {total > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-slate-700">Work Item Breakdown</p>
            </div>
            <div className="divide-y divide-slate-100">
              {items
                .slice()
                .sort((a, b) => b.progressPercent - a.progressPercent)
                .map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-block h-2 w-2 rounded-full",
                            STATUS_COLORS[item.status]
                          )}
                        />
                        <span className="text-xs text-slate-400">
                          {STATUS_LABELS[item.status]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 w-48">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                        <div
                          className={cn("h-1.5 rounded-full", STATUS_COLORS[item.status])}
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-medium text-slate-600">
                        {item.progressPercent}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
