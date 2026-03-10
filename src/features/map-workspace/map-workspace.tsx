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

interface MapWorkspaceProps {
  projectId: string;
}

export function MapWorkspace({ projectId }: MapWorkspaceProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [timestampFilter, setTimestampFilter] = useState<Date | null>(null);

  return (
    <MapProvider>
      <SpatialController
        projectId={projectId}
        onZoneSelect={setSelectedZoneId}
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
      <div className="flex h-full w-full overflow-hidden">
        <LayerToolbar />
        <div className="relative flex flex-1 overflow-hidden">
          <MapContainer />
        </div>
        {selectedZoneId ? (
          <ZoneTaskPanel
            projectId={projectId}
            zoneId={selectedZoneId}
            onClose={() => setSelectedZoneId(null)}
          />
        ) : (
          <TaskInfoPanel />
        )}
      </div>
    </MapProvider>
  );
}
