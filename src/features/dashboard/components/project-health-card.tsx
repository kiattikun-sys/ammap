import type { ProjectHealth } from "@/domains/dashboard/model/project-health";
import { cn } from "@/lib/cn";

interface ProjectHealthCardProps {
  health: ProjectHealth;
}

function HealthBadge({ value }: { value: number }) {
  const color =
    value >= 75
      ? "bg-green-100 text-green-700"
      : value >= 40
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", color)}>
      {value}%
    </span>
  );
}

export function ProjectHealthCard({ health }: ProjectHealthCardProps) {
  const completionRate =
    health.totalTasks > 0
      ? Math.round((health.completedTasks / health.totalTasks) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Project Health</h2>
        <HealthBadge value={health.overallProgress} />
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Overall Progress</span>
          <span>{health.overallProgress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all"
            style={{ width: `${health.overallProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total Tasks" value={health.totalTasks} />
        <Stat
          label="Completed"
          value={`${health.completedTasks} (${completionRate}%)`}
          accent="green"
        />
        <Stat
          label="Open Defects"
          value={health.openDefects}
          accent={health.openDefects > 0 ? "yellow" : "green"}
        />
        <Stat
          label="Critical Defects"
          value={health.criticalDefects}
          accent={health.criticalDefects > 0 ? "red" : "green"}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
        <span>Risk zones: {health.riskZones.join(", ") || "None"}</span>
        <span>Updated {health.lastUpdated.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "green" | "yellow" | "red";
}) {
  const valueColor =
    accent === "red"
      ? "text-red-600"
      : accent === "yellow"
      ? "text-yellow-600"
      : accent === "green"
      ? "text-green-600"
      : "text-slate-800";
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className={cn("text-base font-bold", valueColor)}>{value}</p>
    </div>
  );
}
