import type { SpatialNodeType } from "../model/spatial-node";

export interface DrawingState {
  active: boolean;
  nodeType: SpatialNodeType | null;
  pendingFeature: GeoJSON.Feature | null;
}

export type DrawingMode = "draw_polygon" | "simple_select";

export const DRAWING_STATE_INITIAL: DrawingState = {
  active: false,
  nodeType: null,
  pendingFeature: null,
};

export const NODE_TYPE_HIERARCHY: Record<SpatialNodeType, SpatialNodeType | null> = {
  site: null,
  building: "site",
  floor: "building",
  zone: "floor",
  area: "zone",
};

export const NODE_TYPE_LABELS: Record<SpatialNodeType, string> = {
  site: "Site",
  building: "Building",
  floor: "Floor",
  zone: "Zone",
  area: "Area",
};

export const NODE_TYPE_ORDER: SpatialNodeType[] = [
  "site",
  "building",
  "floor",
  "zone",
  "area",
];
