import type { ProjectMetrics } from "@/domains/dashboard/model/project-metrics";
import type { WorkStatus } from "@/domains/work/model/work-item";

interface ProgressChartProps {
  metrics: ProjectMetrics;
}

const STATUS_COLORS: Record<WorkStatus, string> = {
  planned: "#94a3b8",
  in_progress: "#3b82f6",
  blocked: "#ef4444",
  completed: "#22c55e",
};

const STATUS_LABELS: Record<WorkStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  blocked: "Blocked",
  completed: "Completed",
};

export function ProgressChart({ metrics }: ProgressChartProps) {
  const statuses: WorkStatus[] = ["planned", "in_progress", "blocked", "completed"];
  const total = statuses.reduce(
    (sum, s) => sum + (metrics.tasksByStatus[s] ?? 0),
    0
  );

  // Build SVG donut segments
  const radius = 52;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = statuses.map((status) => {
    const count = metrics.tasksByStatus[status] ?? 0;
    const fraction = total > 0 ? count / total : 0;
    const dash = fraction * circumference;
    const gap = circumference - dash;
    const rotation = (offset / (total || 1)) * 360 - 90;
    offset += count;
    return { status, count, dash, gap, rotation, color: STATUS_COLORS[status] };
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-700">Task Progress</h2>

      <div className="flex items-center gap-6">
        {/* Donut SVG */}
        <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
          {total === 0 ? (
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="18"
            />
          ) : (
            segments.map((seg) => (
              <circle
                key={seg.status}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="18"
                strokeDasharray={`${seg.dash} ${seg.gap}`}
                transform={`rotate(${seg.rotation} ${cx} ${cy})`}
                strokeLinecap="butt"
              />
            ))
          )}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            className="fill-slate-800"
            fontSize="20"
            fontWeight="700"
          >
            {total}
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            className="fill-slate-400"
            fontSize="10"
          >
            tasks
          </text>
        </svg>

        {/* Legend */}
        <div className="flex flex-col gap-2">
          {segments.map((seg) => (
            <div key={seg.status} className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs text-slate-600">
                {STATUS_LABELS[seg.status]}
              </span>
              <span className="ml-auto text-xs font-semibold text-slate-800">
                {seg.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
