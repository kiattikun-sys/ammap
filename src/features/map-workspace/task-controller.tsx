"use client";

import { useEffect, useState } from "react";
import { useMap } from "@/lib/map";
import { LayerManager } from "@/lib/map/layers";
import { TaskRenderer } from "@/lib/map/renderers";
import { listWorkItems } from "@/domains/work/queries/list-work-items";
import { workItemsToGeoJSON } from "@/domains/work/utils/work-to-geojson";
import type { WorkItem } from "@/domains/work/model/work-item";

interface TaskControllerProps {
  projectId: string;
  selectedZoneId?: string | null;
  timestampFilter?: Date | null;
}

export function TaskController({ projectId, selectedZoneId, timestampFilter }: TaskControllerProps) {
  const { map, isLoaded } = useMap();
  const [items, setItems] = useState<WorkItem[]>([]);

  useEffect(() => {
    listWorkItems({ projectId }).then(setItems);
  }, [projectId]);

  useEffect(() => {
    if (!map || !isLoaded || items.length === 0) return;

    const layerManager = new LayerManager(map);
    const taskRenderer = new TaskRenderer({ map, layerManager });
    const filtered = timestampFilter
      ? items.filter((i) => i.createdAt <= timestampFilter)
      : items;
    const geojson = workItemsToGeoJSON(filtered);

    taskRenderer.render(geojson);

    return () => {
      taskRenderer.clear();
    };
  }, [map, isLoaded, items, timestampFilter]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    function handleClick(e: mapboxgl.MapMouseEvent) {
      if (selectedZoneId) {
        const lng = parseFloat(e.lngLat.lng.toFixed(6));
        const lat = parseFloat(e.lngLat.lat.toFixed(6));
        console.log("Create task in zone:", selectedZoneId, { lng, lat });
      }
    }

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, isLoaded, selectedZoneId]);

  return null;
}
