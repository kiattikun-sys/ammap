"use client";

import { useState } from "react";
import { MapProvider } from "@/lib/map";
import { LayerToolbar } from "./layer-toolbar";
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

  function handleZoneSelect(zoneId: string | null) {
    setSelectedZoneId(zoneId);
    if (zoneId) setZoneTab("tasks");
  }

  return (
    <MapProvider>
      <SpatialController
        projectId={projectId}
        onZoneSelect={handleZoneSelect}
      />
      <TaskController
        projectId={projectId}
        selectedZoneId={selectedZoneId}
        timestampFilter={timestampFilter}
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
        <LayerToolbar />
        <div className="relative flex h-full flex-1 overflow-hidden">
          <MapContainer />
        </div>
        {selectedZoneId ? (
          <div className="flex h-full shrink-0 flex-col border-l border-slate-200 bg-white" style={{ width: 320 }}>
            {/* Zone tab switcher */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setZoneTab("tasks")}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  zoneTab === "tasks"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setZoneTab("defects")}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  zoneTab === "defects"
                    ? "border-b-2 border-red-600 text-red-600"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Defects
              </button>
            </div>
            {zoneTab === "tasks" ? (
              <ZoneTaskPanel
                projectId={projectId}
                zoneId={selectedZoneId}
                onClose={() => setSelectedZoneId(null)}
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
