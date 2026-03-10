import { Wrench, AlertTriangle, X } from "lucide-react";

type TabId = "tasks" | "defects";

const placeholderTasks = [
  { id: "t1", title: "Concrete pouring — Block C", status: "In Progress", priority: "High" },
  { id: "t2", title: "Electrical conduit install", status: "Pending", priority: "Medium" },
  { id: "t3", title: "Formwork removal", status: "Complete", priority: "Low" },
];

const placeholderDefects = [
  { id: "d1", title: "Crack in column C4", severity: "Critical", reported: "2d ago" },
  { id: "d2", title: "Missing rebar cover", severity: "Major", reported: "5d ago" },
];

const statusColors: Record<string, string> = {
  "In Progress": "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
  Complete: "bg-green-100 text-green-700",
};

const severityColors: Record<string, string> = {
  Critical: "bg-red-100 text-red-700",
  Major: "bg-orange-100 text-orange-700",
  Minor: "bg-yellow-100 text-yellow-700",
};

export function TaskInfoPanel() {
  return (
    <div className="flex w-72 shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex h-10 items-center justify-between border-b border-slate-100 px-3">
        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center gap-1 border-b-2 border-blue-600 pb-0.5 text-xs font-semibold text-blue-600"
          >
            <Wrench size={12} />
            Tasks
          </button>
          <button
            type="button"
            className="flex items-center gap-1 border-b-2 border-transparent pb-0.5 text-xs text-slate-500 hover:text-slate-700"
          >
            <AlertTriangle size={12} />
            Defects
          </button>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600"
          aria-label="Close panel"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {placeholderTasks.map((task) => (
          <div key={task.id} className="px-3 py-2.5 hover:bg-slate-50">
            <p className="text-xs font-medium text-slate-800">{task.title}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={
                  "rounded px-1.5 py-0.5 text-[10px] font-medium " +
                  (statusColors[task.status] ?? "bg-slate-100 text-slate-600")
                }
              >
                {task.status}
              </span>
              <span className="text-[10px] text-slate-400">{task.priority} priority</span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 px-3 py-2">
        <p className="text-[10px] text-slate-400">
          {placeholderTasks.length} tasks · {placeholderDefects.length} defects in selection
        </p>
      </div>
    </div>
  );
}
