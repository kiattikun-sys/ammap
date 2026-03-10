"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { listWorkItems } from "@/domains/work/queries/list-work-items";
import type { WorkItem } from "@/domains/work/model/work-item";
import { TaskList } from "./task-list";
import { CreateTaskForm } from "./create-task-form";

interface ZoneTaskPanelProps {
  projectId: string;
  zoneId: string;
  zoneName?: string;
  onClose: () => void;
}

export function ZoneTaskPanel({
  projectId,
  zoneId,
  zoneName,
  onClose,
}: ZoneTaskPanelProps) {
  const [tasks, setTasks] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  function loadTasks() {
    setLoading(true);
    listWorkItems({ projectId })
      .then((all) => setTasks(all.filter((t) => t.spatialNodeId === zoneId)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, zoneId]);

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const overallProgress =
    tasks.length > 0
      ? Math.round(tasks.reduce((s, t) => s + t.progressPercent, 0) / tasks.length)
      : 0;

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">
            {zoneName ?? "Zone"}
          </p>
          <p className="text-[10px] text-slate-400">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} · {completedCount} done
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress summary */}
      {tasks.length > 0 && (
        <div className="border-b border-slate-100 px-4 py-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span>Zone Progress</span>
            <span>{overallProgress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Create task toggle */}
      <div className="border-b border-slate-100 px-4 py-3">
        {showForm ? (
          <CreateTaskForm
            projectId={projectId}
            spatialNodeId={zoneId}
            onCreated={() => {
              setShowForm(false);
              loadTasks();
            }}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Create Task
          </button>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading tasks…</div>
        ) : (
          <TaskList tasks={tasks} onUpdated={loadTasks} />
        )}
      </div>
    </div>
  );
}
