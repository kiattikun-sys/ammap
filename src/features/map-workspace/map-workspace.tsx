"use client";

import { useState, useCallback } from "react";
import type { SpatialNode } from "@/domains/spatial/model/spatial-node";
import { MapProvider } from "@/lib/map";
import { LayerToolbar } from "./layer-toolbar";
import type { DrawState } from "./spatial-drawing-controller";
import { MapContainer } from "./map-container";
import { TaskInfoPanel } from "./task-info-panel";
import { SpatialController } from "./spatial-controller";
import { TaskController } from "./task-controller";
import { DefectController } from "./defect-controller";
import { EvidenceController } from "./evidence-controller";
import { TimelineController } from "./timeline-controller";
import { AIController } from "./ai-controller";
import { ZoneTaskPanel } from "@/features/work/components/zone-task-panel";
import { ZoneDefectPanel } from "@/features/quality/components/zone-defect-panel";

interface MapWorkspaceProps {
  projectId: string;
}

type ZoneTab = "tasks" | "defects";

export function MapWorkspace({ projectId }: MapWorkspaceProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [timestampFilter, setTimestampFilter] = useState<Date | null>(null);
  const [zoneTab, setZoneTab] = useState<ZoneTab>("tasks");
  const [spatialNodes, setSpatialNodes] = useState<SpatialNode[]>([]);
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);
  const bumpTaskRefresh = useCallback(() => setTaskRefreshKey((k) => k + 1), []);
  const [drawState, setDrawState] = useState<DrawState | null>(null);

  function handleZoneSelect(zoneId: string | null) {
    setSelectedZoneId(zoneId);
    if (zoneId) setZoneTab("tasks");
  }

  const handleWorkItemClick = useCallback((spatialNodeId: string) => {
    setSelectedZoneId(spatialNodeId);
    setZoneTab("tasks");
  }, []);

  return (
    <MapProvider>
      <SpatialController
        projectId={projectId}
        selectedNodeId={selectedZoneId}
        onZoneSelect={handleZoneSelect}
        onNodesChange={setSpatialNodes}
        onDrawStateChange={setDrawState}
      />
      <TaskController
        projectId={projectId}
        selectedZoneId={selectedZoneId}
        timestampFilter={timestampFilter}
        spatialNodes={spatialNodes}
        onWorkItemClick={handleWorkItemClick}
        refreshKey={taskRefreshKey}
      />
      <DefectController
        projectId={projectId}
        selectedZoneId={selectedZoneId}
        defectMode={false}
        timestampFilter={timestampFilter}
      />
      <EvidenceController
        projectId={projectId}
        selectedZoneId={selectedZoneId}
        captureMode={false}
        timestampFilter={timestampFilter}
      />
      <TimelineController
        projectId={projectId}
        onTimestampFilterChange={setTimestampFilter}
      />
      <AIController projectId={projectId} />
      <div className="flex w-full overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>
        <LayerToolbar drawState={drawState} />
        <div className="relative flex h-full flex-1 overflow-hidden">
          <MapContainer />
        </div>
        {selectedZoneId ? (
          <div className="flex h-full shrink-0 flex-col border-l border-slate-200 bg-white" style={{ width: 320 }}>
            {/* Zone header + tab switcher */}
            <div className="flex items-center border-b border-slate-100 px-3 py-2 gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {spatialNodes.find((n) => n.id === selectedZoneId)?.name ?? "Zone"}
                </p>
              </div>
              <button
                onClick={() => setZoneTab("tasks")}
                className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
                  zoneTab === "tasks"
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setZoneTab("defects")}
                className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
                  zoneTab === "defects"
                    ? "bg-red-50 text-red-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Defects
              </button>
              <button
                onClick={() => setSelectedZoneId(null)}
                className="ml-1 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            {zoneTab === "tasks" ? (
              <ZoneTaskPanel
                projectId={projectId}
                zoneId={selectedZoneId}
                onTaskMutated={bumpTaskRefresh}
              />
            ) : (
              <ZoneDefectPanel
                projectId={projectId}
                zoneId={selectedZoneId}
                onClose={() => setSelectedZoneId(null)}
              />
            )}
          </div>
        ) : (
          <TaskInfoPanel />
        )}
      </div>
    </MapProvider>
  );
}
