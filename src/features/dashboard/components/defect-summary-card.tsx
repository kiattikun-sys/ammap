import type { ProjectMetrics } from "@/domains/dashboard/model/project-metrics";
import type { DefectSeverity } from "@/domains/quality/model/defect";
import { cn } from "@/lib/cn";

interface DefectSummaryCardProps {
  metrics: ProjectMetrics;
}

const SEVERITY_COLORS: Record<DefectSeverity, string> = {
  low: "bg-yellow-400",
  medium: "bg-orange-400",
  high: "bg-red-400",
  critical: "bg-purple-500",
};

const SEVERITY_TEXT: Record<DefectSeverity, string> = {
  low: "text-yellow-700",
  medium: "text-orange-700",
  high: "text-red-700",
  critical: "text-purple-700",
};

const SEVERITY_BG: Record<DefectSeverity, string> = {
  low: "bg-yellow-50",
  medium: "bg-orange-50",
  high: "bg-red-50",
  critical: "bg-purple-50",
};

const severities: DefectSeverity[] = ["critical", "high", "medium", "low"];

export function DefectSummaryCard({ metrics }: DefectSummaryCardProps) {
  const total = severities.reduce(
    (sum, s) => sum + (metrics.defectsBySeverity[s] ?? 0),
    0
  );
  const maxCount = Math.max(
    ...severities.map((s) => metrics.defectsBySeverity[s] ?? 0),
    1
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Defects by Severity</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {total} total
        </span>
      </div>

      <div className="space-y-3">
        {severities.map((severity) => {
          const count = metrics.defectsBySeverity[severity] ?? 0;
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={severity}>
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                    SEVERITY_BG[severity],
                    SEVERITY_TEXT[severity]
                  )}
                >
                  {severity}
                </span>
                <span className="text-xs font-semibold text-slate-700">{count}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn("h-1.5 rounded-full transition-all", SEVERITY_COLORS[severity])}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
