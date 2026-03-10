import type { SpatialNode } from "../model/spatial-node";

export const TYPE_COLORS: Record<string, string> = {
  site: "#6366f1",
  building: "#3b82f6",
  floor: "#06b6d4",
  zone: "#10b981",
  area: "#f59e0b",
};

export const TYPE_LINE_WIDTHS: Record<string, number> = {
  site: 4,
  building: 3,
  floor: 2,
  zone: 2,
  area: 1,
};

export const TYPE_FILL_OPACITY: Record<string, number> = {
  site: 0.05,
  building: 0.1,
  floor: 0.12,
  zone: 0.2,
  area: 0.15,
};

export function spatialNodesToGeoJSON(
  nodes: SpatialNode[]
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  for (const node of nodes) {
    if (!node.geometry) continue;

    const color =
      (node.metadata["color"] as string | undefined) ??
      TYPE_COLORS[node.type] ??
      "#94a3b8";

    features.push({
      type: "Feature",
      properties: {
        id: node.id,
        name: node.name,
        type: node.type,
        color,
        lineWidth: TYPE_LINE_WIDTHS[node.type] ?? 2,
        fillOpacity: TYPE_FILL_OPACITY[node.type] ?? 0.15,
        level: node.level,
        parentId: node.parentId,
        projectId: node.projectId,
      },
      geometry: node.geometry as GeoJSON.Geometry,
    });
  }

  return { type: "FeatureCollection", features };
}
