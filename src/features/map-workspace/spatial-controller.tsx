"use client";

import { useEffect, useState } from "react";
import type mapboxgl from "mapbox-gl";
import { useMap } from "@/lib/map";
import { LayerManager } from "@/lib/map/layers";
import { listSpatialNodes } from "@/domains/spatial/queries/list-spatial-nodes";
import { spatialNodesToGeoJSON } from "@/domains/spatial/utils/spatial-to-geojson";
import type { SpatialNode } from "@/domains/spatial/model/spatial-node";
import { SpatialDrawingController } from "./spatial-drawing-controller";

const SPATIAL_SOURCE_ID = "spatial-nodes-source";
const SPATIAL_FILL_LAYER = "spatial-nodes-fill";
const SPATIAL_LINE_LAYER = "spatial-nodes-line";
const SPATIAL_LABEL_LAYER = "spatial-nodes-label";

interface SpatialControllerProps {
  projectId: string;
  onZoneSelect?: (zoneId: string | null) => void;
}

export function SpatialController({ projectId, onZoneSelect }: SpatialControllerProps) {
  const { map, isLoaded } = useMap();
  const [nodes, setNodes] = useState<SpatialNode[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    listSpatialNodes({ projectId }).then(setNodes);
  }, [projectId, refreshKey]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const geojson = spatialNodesToGeoJSON(nodes);
    const layerManager = new LayerManager(map);

    if (!map.getSource(SPATIAL_SOURCE_ID)) {
      map.addSource(SPATIAL_SOURCE_ID, { type: "geojson", data: geojson });
    } else {
      (map.getSource(SPATIAL_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(geojson);
    }

    if (!map.getLayer(SPATIAL_FILL_LAYER)) {
      map.addLayer({
        id: SPATIAL_FILL_LAYER,
        type: "fill",
        source: SPATIAL_SOURCE_ID,
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": ["get", "fillOpacity"],
        },
      });
    }

    if (!map.getLayer(SPATIAL_LINE_LAYER)) {
      map.addLayer({
        id: SPATIAL_LINE_LAYER,
        type: "line",
        source: SPATIAL_SOURCE_ID,
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["get", "lineWidth"],
          "line-opacity": 0.85,
        },
      });
    }

    if (!map.getLayer(SPATIAL_LABEL_LAYER)) {
      map.addLayer({
        id: SPATIAL_LABEL_LAYER,
        type: "symbol",
        source: SPATIAL_SOURCE_ID,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#1e293b",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        },
      });
    }

    layerManager.register({ id: SPATIAL_FILL_LAYER, label: "Spatial (Fill)", type: "fill", visible: true, sourceId: SPATIAL_SOURCE_ID });
    layerManager.register({ id: SPATIAL_LINE_LAYER, label: "Spatial (Border)", type: "line", visible: true, sourceId: SPATIAL_SOURCE_ID });

    return () => {
      try {
        if (!map.isStyleLoaded()) return;
        for (const id of [SPATIAL_FILL_LAYER, SPATIAL_LINE_LAYER, SPATIAL_LABEL_LAYER]) {
          if (map.getLayer(id)) map.removeLayer(id);
        }
        if (map.getSource(SPATIAL_SOURCE_ID)) map.removeSource(SPATIAL_SOURCE_ID);
      } catch {
        // map was destroyed before cleanup
      }
    };
  }, [map, isLoaded, nodes]);

  useEffect(() => {
    if (!map || !isLoaded || !onZoneSelect) return;

    function handleNodeClick(e: mapboxgl.MapLayerMouseEvent) {
      const features = e.features;
      if (features && features.length > 0) {
        const nodeId = features[0].properties?.["id"] as string | undefined;
        onZoneSelect?.(nodeId ?? null);
      }
    }

    function handleMapClick() {
      onZoneSelect?.(null);
    }

    map.on("click", SPATIAL_FILL_LAYER, handleNodeClick);
    map.on("click", handleMapClick);

    return () => {
      map.off("click", SPATIAL_FILL_LAYER, handleNodeClick);
      map.off("click", handleMapClick);
    };
  }, [map, isLoaded, onZoneSelect]);

  return (
    <SpatialDrawingController
      projectId={projectId}
      existingNodes={nodes}
      onNodeCreated={(node) => {
        setNodes((prev) => [...prev, node]);
        setRefreshKey((k) => k + 1);
      }}
    />
  );
}
