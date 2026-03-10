"use client";

import { useEffect, useState } from "react";
import type mapboxgl from "mapbox-gl";
import { useMap } from "@/lib/map";
import { LayerManager } from "@/lib/map/layers";
import { EvidenceRenderer } from "@/lib/map/renderers";
import { listEvidence } from "@/domains/evidence/queries/list-evidence";
import { evidenceToGeoJSON } from "@/domains/evidence/utils/evidence-to-geojson";
import type { Evidence } from "@/domains/evidence/model/evidence";
import { EvidenceUploadModal } from "@/features/evidence/components/evidence-upload-modal";

interface EvidenceControllerProps {
  projectId: string;
  selectedZoneId?: string | null;
  captureMode?: boolean;
  timestampFilter?: Date | null;
}

interface CaptureTarget {
  lng: number;
  lat: number;
}

export function EvidenceController({
  projectId,
  selectedZoneId,
  captureMode = false,
  timestampFilter,
}: EvidenceControllerProps) {
  const { map, isLoaded } = useMap();
  const [items, setItems] = useState<Evidence[]>([]);
  const [captureTarget, setCaptureTarget] = useState<CaptureTarget | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    listEvidence({ projectId }).then(setItems);
  }, [projectId, refreshKey]);

  useEffect(() => {
    if (!map || !isLoaded || items.length === 0) return;

    const layerManager = new LayerManager(map);
    const evidenceRenderer = new EvidenceRenderer({ map, layerManager });
    const filtered = timestampFilter
      ? items.filter((i) => i.createdAt <= timestampFilter)
      : items;
    const geojson = evidenceToGeoJSON(filtered);

    evidenceRenderer.render(geojson);

    return () => {
      evidenceRenderer.clear();
    };
  }, [map, isLoaded, items, timestampFilter]);

  useEffect(() => {
    if (!map || !isLoaded || !captureMode) return;

    function handleClick(e: mapboxgl.MapMouseEvent) {
      const lng = parseFloat(e.lngLat.lng.toFixed(6));
      const lat = parseFloat(e.lngLat.lat.toFixed(6));
      setCaptureTarget({ lng, lat });
    }

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, isLoaded, captureMode]);

  return (
    <>
      {captureTarget && (
        <EvidenceUploadModal
          projectId={projectId}
          spatialNodeId={selectedZoneId}
          locationLng={captureTarget.lng}
          locationLat={captureTarget.lat}
          onClose={() => setCaptureTarget(null)}
          onUploaded={() => {
            setCaptureTarget(null);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </>
  );
}
