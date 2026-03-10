"use client";

import { useEffect, useState } from "react";
import type mapboxgl from "mapbox-gl";
import { useMap } from "@/lib/map";
import { LayerManager } from "@/lib/map/layers";
import { DefectRenderer } from "@/lib/map/renderers";
import { listDefects } from "@/domains/quality/queries/list-defects";
import { defectsToGeoJSON } from "@/domains/quality/utils/defect-to-geojson";
import type { Defect } from "@/domains/quality/model/defect";

interface DefectControllerProps {
  projectId: string;
  selectedZoneId?: string | null;
  defectMode?: boolean;
  timestampFilter?: Date | null;
}

export function DefectController({
  projectId,
  selectedZoneId,
  defectMode = false,
  timestampFilter,
}: DefectControllerProps) {
  const { map, isLoaded } = useMap();
  const [defects, setDefects] = useState<Defect[]>([]);

  useEffect(() => {
    listDefects({ projectId }).then(setDefects);
  }, [projectId]);

  useEffect(() => {
    if (!map || !isLoaded || defects.length === 0) return;

    const layerManager = new LayerManager(map);
    const defectRenderer = new DefectRenderer({ map, layerManager });
    const filtered = timestampFilter
      ? defects.filter((d) => d.createdAt <= timestampFilter)
      : defects;
    const geojson = defectsToGeoJSON(filtered);

    defectRenderer.render(geojson);

    return () => {
      defectRenderer.clear();
    };
  }, [map, isLoaded, defects, timestampFilter]);

  useEffect(() => {
    if (!map || !isLoaded || !defectMode) return;

    function handleClick(e: mapboxgl.MapMouseEvent) {
      const lng = parseFloat(e.lngLat.lng.toFixed(6));
      const lat = parseFloat(e.lngLat.lat.toFixed(6));

      if (selectedZoneId) {
        console.log("Create defect at:", selectedZoneId, lng, lat);
      } else {
        console.log("Create defect at:", { lng, lat }, "(no zone selected)");
      }
    }

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, isLoaded, defectMode, selectedZoneId]);

  return null;
}
