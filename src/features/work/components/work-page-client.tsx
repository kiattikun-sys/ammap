"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { WorkItem, WorkStatus } from "@/domains/work/model/work-item";
import type { OrgProfile } from "@/domains/profiles/queries/list-org-profiles";
import { cn } from "@/lib/cn";

interface WorkPageClientProps {
  projectId: string;
  items: WorkItem[];
  profiles: OrgProfile[];
  activeStatus?: WorkStatus;
}

const STATUS_TABS: { value: WorkStatus | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "completed", label: "Completed" },
];

const STATUS_COLORS: Record<WorkStatus, string> = {
  planned: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-700",
  blocked: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "text-red-600 font-semibold",
  high: "text-orange-600",
  medium: "text-slate-600",
  low: "text-slate-400",
};

function resolveAssignee(profiles: OrgProfile[], id: string | null): string {
  if (!id) return "—";
  return profiles.find((p) => p.id === id)?.displayName ?? id.slice(0, 8);
}

export function WorkPageClient({
  projectId,
  items,
  profiles,
  activeStatus,
}: WorkPageClientProps) {
  const router = useRouter();

  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.value ?? "all"] = tab.value
      ? items.filter((i) => i.status === tab.value).length
      : items.length;
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-slate-800">Work Items</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200 bg-white px-6">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.value;
          const href = (tab.value
            ? `/${projectId}/work?status=${tab.value}`
            : `/${projectId}/work`) as Route;
          return (
            <Link
              key={tab.value ?? "all"}
              href={href}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "border-blue-600 text-blue-700 font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                )}
              >
                {counts[tab.value ?? "all"] ?? 0}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {items.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400">
            No work items{activeStatus ? ` with status "${activeStatus}"` : ""}.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Priority</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Progress</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Assignee</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{item.title}</p>
                      {item.description && (
                        <p className="mt-0.5 truncate text-xs text-slate-400 max-w-xs">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_COLORS[item.status]
                        )}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs", PRIORITY_COLORS[item.priority])}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-slate-100">
                          <div
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${item.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{item.progressPercent}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {resolveAssignee(profiles, item.assignedTo)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
