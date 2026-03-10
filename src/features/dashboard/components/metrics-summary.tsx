import type { ProjectMetrics } from "@/domains/dashboard/model/project-metrics";

interface MetricsSummaryProps {
  metrics: ProjectMetrics;
}

export function MetricsSummary({ metrics }: MetricsSummaryProps) {
  const stats = [
    { label: "Active Zones", value: metrics.zonesActive, icon: "🗺️" },
    { label: "Evidence Items", value: metrics.evidenceCount, icon: "📎" },
    { label: "Timeline Events", value: metrics.timelineEvents, icon: "📅" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <span className="mb-1 text-2xl">{stat.icon}</span>
          <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
          <span className="text-[11px] text-slate-500">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
