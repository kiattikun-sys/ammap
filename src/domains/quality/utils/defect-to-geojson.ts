import type { Defect, DefectSeverity } from "../model/defect";

const SEVERITY_COLORS: Record<DefectSeverity, string> = {
  low: "#eab308",
  medium: "#f97316",
  high: "#ef4444",
  critical: "#a855f7",
};

export function defectsToGeoJSON(
  defects: Defect[]
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const defect of defects) {
    if (defect.locationLng === null || defect.locationLat === null) continue;

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
        color: SEVERITY_COLORS[defect.severity],
      },
      geometry: {
        type: "Point",
        coordinates: [defect.locationLng, defect.locationLat],
      },
    });
  }

  return { type: "FeatureCollection", features };
}
