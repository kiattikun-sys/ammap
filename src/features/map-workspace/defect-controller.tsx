"use client";

import { useEffect, useState } from "react";
import type mapboxgl from "mapbox-gl";
import { useMap } from "@/lib/map";
import { LayerManager } from "@/lib/map/layers";
import { DefectRenderer } from "@/lib/map/renderers";
import { listDefects } from "@/domains/quality/queries/list-defects";
import { defectsToGeoJSON } from "@/domains/quality/utils/defect-to-geojson";
import type { Defect } from "@/domains/quality/model/defect";
import type { SpatialNode } from "@/domains/spatial/model/spatial-node";

const DEFECT_CIRCLE_LAYER_ID = "defects-circle";

interface DefectControllerProps {
  projectId: string;
  selectedZoneId?: string | null;
  defectMode?: boolean;
  timestampFilter?: Date | null;
  spatialNodes?: SpatialNode[];
  refreshKey?: number;
  onDefectClick?: (defectId: string) => void;
}

export function DefectController({
  projectId,
  selectedZoneId,
  defectMode = false,
  timestampFilter,
  spatialNodes = [],
  refreshKey = 0,
  onDefectClick,
}: DefectControllerProps) {
  const { map, isLoaded } = useMap();
  const [defects, setDefects] = useState<Defect[]>([]);

  useEffect(() => {
    listDefects({ projectId }).then(setDefects);
  }, [projectId, refreshKey]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const layerManager = new LayerManager(map);
    const defectRenderer = new DefectRenderer({ map, layerManager });
    const filtered = timestampFilter
      ? defects.filter((d) => d.createdAt <= timestampFilter)
      : defects;
    const geojson = defectsToGeoJSON(filtered, spatialNodes);

    defectRenderer.render(geojson);

    return () => {
      defectRenderer.clear();
    };
  }, [map, isLoaded, defects, timestampFilter, spatialNodes]);

  useEffect(() => {
    if (!map || !isLoaded || !onDefectClick) return;
    const m = map;

    function handleDefectClick(e: mapboxgl.MapLayerMouseEvent) {
      const feature = e.features?.[0];
      if (!feature) return;
      const defectId = feature.properties?.["id"] as string | undefined;
      if (defectId) onDefectClick?.(defectId);
    }

    function handleMouseEnter() { m.getCanvas().style.cursor = "pointer"; }
    function handleMouseLeave() { m.getCanvas().style.cursor = ""; }

    m.on("click", DEFECT_CIRCLE_LAYER_ID, handleDefectClick);
    m.on("mouseenter", DEFECT_CIRCLE_LAYER_ID, handleMouseEnter);
    m.on("mouseleave", DEFECT_CIRCLE_LAYER_ID, handleMouseLeave);

    return () => {
      m.off("click", DEFECT_CIRCLE_LAYER_ID, handleDefectClick);
      m.off("mouseenter", DEFECT_CIRCLE_LAYER_ID, handleMouseEnter);
      m.off("mouseleave", DEFECT_CIRCLE_LAYER_ID, handleMouseLeave);
    };
  }, [map, isLoaded, onDefectClick]);

  useEffect(() => {
    if (!map || !isLoaded || !defectMode) return;

    function handleClick(e: mapboxgl.MapMouseEvent) {
      const lng = parseFloat(e.lngLat.lng.toFixed(6));
      const lat = parseFloat(e.lngLat.lat.toFixed(6));
      if (selectedZoneId) {
        console.log("Create defect at:", selectedZoneId, lng, lat);
      }
    }

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, isLoaded, defectMode, selectedZoneId]);

  return null;
}
