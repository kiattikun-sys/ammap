import type { Defect, DefectStatus } from "../model/defect";
import type { SpatialNode } from "@/domains/spatial/model/spatial-node";

export const DEFECT_STATUS_COLORS: Record<DefectStatus, string> = {
  open: "#ef4444",
  in_progress: "#f97316",
  pending_reinspection: "#eab308",
  resolved: "#3b82f6",
  closed: "#22c55e",
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

export function defectsToGeoJSON(
  defects: Defect[],
  spatialNodes: SpatialNode[] = []
): GeoJSON.FeatureCollection {
  const nodeById = new Map(spatialNodes.map((n) => [n.id, n]));
  const features: GeoJSON.Feature[] = [];

  for (const defect of defects) {
    let coordinates: [number, number] | null = null;

    if (defect.locationLng !== null && defect.locationLat !== null) {
      coordinates = [defect.locationLng, defect.locationLat];
    } else if (defect.spatialNodeId) {
      const node = nodeById.get(defect.spatialNodeId);
      coordinates = node?.geometry ? computeCentroid(node.geometry) : null;
    }

    if (!coordinates) continue;

    features.push({
      type: "Feature",
      properties: {
        id: defect.id,
        title: defect.title,
        severity: defect.severity,
        status: defect.status,
        spatialNodeId: defect.spatialNodeId,
        inspectionId: defect.inspectionId,
        assignedTo: defect.assignedTo,
        color: DEFECT_STATUS_COLORS[defect.status],
      },
      geometry: {
        type: "Point",
        coordinates,
      },
    });
  }

  return { type: "FeatureCollection", features };
}
