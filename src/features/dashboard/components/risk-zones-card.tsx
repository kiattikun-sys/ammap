import { cn } from "@/lib/cn";

interface RiskZone {
  zoneId: string;
  defectCount: number;
  severity: string;
}

interface RiskZonesCardProps {
  riskSummary: RiskZone[];
}

const SEVERITY_STYLES: Record<string, { dot: string; badge: string; text: string }> = {
  critical: {
    dot: "bg-purple-500",
    badge: "bg-purple-50 text-purple-700",
    text: "Critical",
  },
  high: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700",
    text: "High",
  },
  medium: {
    dot: "bg-orange-400",
    badge: "bg-orange-50 text-orange-700",
    text: "Medium",
  },
  low: {
    dot: "bg-yellow-400",
    badge: "bg-yellow-50 text-yellow-700",
    text: "Low",
  },
};

export function RiskZonesCard({ riskSummary }: RiskZonesCardProps) {
  const sorted = [...riskSummary].sort((a, b) => {
    const order = ["critical", "high", "medium", "low"];
    return order.indexOf(a.severity) - order.indexOf(b.severity);
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Risk Zones</h2>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            sorted.length === 0
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          )}
        >
          {sorted.length === 0 ? "All Clear" : `${sorted.length} zones`}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">
          No risk zones detected.
        </p>
      ) : (
        <div className="space-y-2">
          {sorted.map((zone) => {
            const style =
              SEVERITY_STYLES[zone.severity] ?? SEVERITY_STYLES["medium"];
            return (
              <div
                key={zone.zoneId}
                className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2"
              >
                <span
                  className={cn("h-2.5 w-2.5 shrink-0 rounded-full", style.dot)}
                />
                <span className="flex-1 text-sm text-slate-700">{zone.zoneId}</span>
                <span className="text-xs text-slate-400">
                  {zone.defectCount} defect{zone.defectCount !== 1 ? "s" : ""}
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                    style.badge
                  )}
                >
                  {style.text}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
