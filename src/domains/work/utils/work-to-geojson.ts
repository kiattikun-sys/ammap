import type { WorkItem, WorkStatus } from "../model/work-item";
import { MOCK_SPATIAL_NODES_BY_ID } from "./spatial-node-lookup";

const STATUS_COLORS: Record<WorkStatus, string> = {
  planned: "#94a3b8",
  in_progress: "#3b82f6",
  blocked: "#ef4444",
  completed: "#22c55e",
};

export function workItemsToGeoJSON(
  items: WorkItem[]
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const item of items) {
    const coords = item.spatialNodeId
      ? MOCK_SPATIAL_NODES_BY_ID[item.spatialNodeId]
      : null;

    if (!coords) continue;

    features.push({
      type: "Feature",
      properties: {
        id: item.id,
        title: item.title,
        status: item.status,
        priority: item.priority,
        progress: item.progress,
        assignedTo: item.assignedTo,
        spatialNodeId: item.spatialNodeId,
        color: STATUS_COLORS[item.status],
      },
      geometry: {
        type: "Point",
        coordinates: coords,
      },
    });
  }

  return { type: "FeatureCollection", features };
}
