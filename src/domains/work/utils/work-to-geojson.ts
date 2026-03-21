import type { WorkItem, WorkStatus } from "../model/work-item";
import type { SpatialNode } from "@/domains/spatial/model/spatial-node";

const STATUS_COLORS: Record<WorkStatus, string> = {
  planned: "#94a3b8",
  in_progress: "#3b82f6",
  blocked: "#ef4444",
  completed: "#22c55e",
};

function computeCentroid(geometry: GeoJSON.Geometry): [number, number] | null {
  if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") return null;
  const ring =
    geometry.type === "Polygon"
      ? geometry.coordinates[0]
      : geometry.coordinates[0][0];
  if (!ring || ring.length === 0) return null;
  const lngs = ring.map((c) => c[0]);
  const lats = ring.map((c) => c[1]);
  return [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
}

export function workItemsToGeoJSON(
  items: WorkItem[],
  spatialNodes: SpatialNode[] = []
): GeoJSON.FeatureCollection {
  const nodeById = new Map(spatialNodes.map((n) => [n.id, n]));
  const features: GeoJSON.Feature[] = [];

  for (const item of items) {
    if (!item.spatialNodeId) continue;
    const node = nodeById.get(item.spatialNodeId);
    const centroid = node?.geometry ? computeCentroid(node.geometry) : null;
    if (!centroid) continue;

    features.push({
      type: "Feature",
      properties: {
        id: item.id,
        title: item.title,
        status: item.status,
        priority: item.priority,
        progress: item.progressPercent,
        assignedTo: item.assignedTo,
        spatialNodeId: item.spatialNodeId,
        color: STATUS_COLORS[item.status],
      },
      geometry: {
        type: "Point",
        coordinates: centroid,
      },
    });
  }

  return { type: "FeatureCollection", features };
}
