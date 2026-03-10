import type { Evidence, EvidenceType } from "../model/evidence";

const TYPE_COLORS: Record<EvidenceType, string> = {
  photo: "#3b82f6",
  video: "#a855f7",
  document: "#94a3b8",
};

export function evidenceToGeoJSON(
  items: Evidence[]
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const item of items) {
    if (item.locationLng === null || item.locationLat === null) continue;

    features.push({
      type: "Feature",
      properties: {
        id: item.id,
        title: item.title,
        type: item.type,
        fileUrl: item.fileUrl,
        thumbnailUrl: item.thumbnailUrl,
        spatialNodeId: item.spatialNodeId,
        workItemId: item.workItemId,
        defectId: item.defectId,
        capturedBy: item.capturedBy,
        color: TYPE_COLORS[item.type],
      },
      geometry: {
        type: "Point",
        coordinates: [item.locationLng, item.locationLat],
      },
    });
  }

  return { type: "FeatureCollection", features };
}
