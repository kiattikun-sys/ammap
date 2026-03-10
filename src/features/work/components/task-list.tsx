"use client";

import { useState } from "react";
import type { WorkItem, WorkStatus } from "@/domains/work/model/work-item";
import { updateWorkProgress } from "@/domains/work/actions/update-work-progress";

interface TaskListProps {
  tasks: WorkItem[];
  onUpdated?: () => void;
}

const STATUS_STYLES: Record<WorkStatus, string> = {
  planned: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  blocked: "bg-red-100 text-red-700",
  completed: "bg-green-100 text-green-700",
};

const STATUS_LABELS: Record<WorkStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  blocked: "Blocked",
  completed: "Completed",
};

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  critical: "bg-red-600",
};

function TaskCard({ task, onUpdated }: { task: WorkItem; onUpdated?: () => void }) {
  const [editing, setEditing] = useState(false);
  const [progress, setProgress] = useState(task.progressPercent);
  const [saving, setSaving] = useState(false);

  const isOverdue =
    task.dueDate && task.status !== "completed" && new Date() > task.dueDate;

  async function handleProgressSave() {
    setSaving(true);
    try {
      await updateWorkProgress(task.id, progress);
      onUpdated?.();
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority] ?? "bg-slate-400"}`}
            title={task.priority}
          />
          <p className="truncate text-sm font-medium text-slate-800">{task.title}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[task.status]}`}
        >
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      {task.description && (
        <p className="mb-2 text-xs text-slate-500 line-clamp-2">{task.description}</p>
      )}

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span>Progress</span>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-blue-500 hover:underline"
          >
            {task.progressPercent}%
          </button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${
              task.status === "completed" ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${task.progressPercent}%` }}
          />
        </div>
        {editing && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs w-8 text-slate-600">{progress}%</span>
            <button
              onClick={handleProgressSave}
              disabled={saving}
              className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "…" : "Save"}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-[10px] text-slate-400">
        {task.dueDate && (
          <span className={isOverdue ? "text-red-500 font-medium" : ""}>
            📅 {isOverdue ? "Overdue · " : ""}
            {task.dueDate.toLocaleDateString()}
          </span>
        )}
        {task.assignedTo && (
          <span className="truncate">👤 {task.assignedTo.slice(0, 8)}…</span>
        )}
      </div>
    </div>
  );
}

export function TaskList({ tasks, onUpdated }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-slate-500">No tasks yet</p>
        <p className="text-xs text-slate-400">Create a task to get started</p>
      </div>
    );
  }

  const grouped = tasks.reduce<Record<string, WorkItem[]>>((acc, t) => {
    const key = t.spatialNodeId ?? "__none__";
    (acc[key] ??= []).push(t);
    return acc;
  }, {});

  const hasMultipleZones = Object.keys(grouped).length > 1;

  if (!hasMultipleZones) {
    return (
      <div className="space-y-2">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onUpdated={onUpdated} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([zoneId, zoneTasks]) => (
        <div key={zoneId}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {zoneId === "__none__" ? "Unassigned" : `Zone ${zoneId.slice(0, 8)}…`}
          </p>
          <div className="space-y-2">
            {zoneTasks.map((t) => (
              <TaskCard key={t.id} task={t} onUpdated={onUpdated} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
