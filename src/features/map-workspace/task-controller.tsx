"use client";

import { useEffect, useState } from "react";
import type mapboxgl from "mapbox-gl";
import { useMap } from "@/lib/map";
import { LayerManager } from "@/lib/map/layers";
import { TaskRenderer } from "@/lib/map/renderers";
import { listWorkItems } from "@/domains/work/queries/list-work-items";
import { workItemsToGeoJSON } from "@/domains/work/utils/work-to-geojson";
import type { WorkItem } from "@/domains/work/model/work-item";
import type { SpatialNode } from "@/domains/spatial/model/spatial-node";

const TASK_CIRCLE_LAYER_ID = "tasks-circle";

interface TaskControllerProps {
  projectId: string;
  selectedZoneId?: string | null;
  timestampFilter?: Date | null;
  spatialNodes?: SpatialNode[];
  onWorkItemClick?: (spatialNodeId: string) => void;
  onWorkItemCreated?: (item: WorkItem) => void;
  refreshKey?: number;
}

export function TaskController({
  projectId,
  selectedZoneId,
  timestampFilter,
  spatialNodes = [],
  onWorkItemClick,
  refreshKey = 0,
}: TaskControllerProps) {
  const { map, isLoaded } = useMap();
  const [items, setItems] = useState<WorkItem[]>([]);

  useEffect(() => {
    listWorkItems({ projectId }).then(setItems);
  }, [projectId, refreshKey]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const layerManager = new LayerManager(map);
    const taskRenderer = new TaskRenderer({ map, layerManager });
    const filtered = timestampFilter
      ? items.filter((i) => i.createdAt <= timestampFilter)
      : items;
    const geojson = workItemsToGeoJSON(filtered, spatialNodes);

    taskRenderer.render(geojson);

    return () => {
      taskRenderer.clear();
    };
  }, [map, isLoaded, items, timestampFilter, spatialNodes]);

  useEffect(() => {
    if (!map || !isLoaded || !onWorkItemClick) return;
    const m = map;

    function handleMarkerClick(e: mapboxgl.MapLayerMouseEvent) {
      const feature = e.features?.[0];
      if (!feature) return;
      const spatialNodeId = feature.properties?.["spatialNodeId"] as string | undefined;
      if (spatialNodeId) onWorkItemClick?.(spatialNodeId);
    }

    function handleMouseEnter() { m.getCanvas().style.cursor = "pointer"; }
    function handleMouseLeave() { m.getCanvas().style.cursor = ""; }

    map.on("click", TASK_CIRCLE_LAYER_ID, handleMarkerClick);
    map.on("mouseenter", TASK_CIRCLE_LAYER_ID, handleMouseEnter);
    map.on("mouseleave", TASK_CIRCLE_LAYER_ID, handleMouseLeave);

    return () => {
      map.off("click", TASK_CIRCLE_LAYER_ID, handleMarkerClick);
      map.off("mouseenter", TASK_CIRCLE_LAYER_ID, handleMouseEnter);
      map.off("mouseleave", TASK_CIRCLE_LAYER_ID, handleMouseLeave);
    };
  }, [map, isLoaded, onWorkItemClick]);

  return null;
}
