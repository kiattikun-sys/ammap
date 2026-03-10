"use client";

import { useEffect, useState } from "react";
import { dashboardService } from "@/domains/dashboard/services/dashboard-service";
import type { ProjectHealth } from "@/domains/dashboard/model/project-health";
import type { ProjectMetrics } from "@/domains/dashboard/model/project-metrics";

export interface DashboardState {
  health: ProjectHealth | null;
  metrics: ProjectMetrics | null;
  riskSummary: { zoneId: string; defectCount: number; severity: string }[];
  loading: boolean;
  error: string | null;
}

interface DashboardControllerProps {
  projectId: string;
  children: (state: DashboardState) => React.ReactNode;
}

export function DashboardController({
  projectId,
  children,
}: DashboardControllerProps) {
  const [state, setState] = useState<DashboardState>({
    health: null,
    metrics: null,
    riskSummary: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    setState((s) => ({ ...s, loading: true, error: null }));

    Promise.all([
      dashboardService.getProjectHealth(projectId),
      dashboardService.getProjectMetrics(projectId),
      dashboardService.getRiskSummary(projectId),
    ])
      .then(([health, metrics, riskSummary]) => {
        setState({ health, metrics, riskSummary, loading: false, error: null });
      })
      .catch((err: unknown) => {
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load dashboard",
        }));
      });
  }, [projectId]);

  return <>{children(state)}</>;
}
