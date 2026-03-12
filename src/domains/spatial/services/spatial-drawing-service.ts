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
  level: "building",
  zone: "floor",
  area: "zone",
};

export const NODE_TYPE_LABELS: Record<SpatialNodeType, string> = {
  site: "Site",
  building: "Building",
  floor: "Floor",
  level: "Level",
  zone: "Zone",
  area: "Area",
};

export const NODE_TYPE_COLORS: Record<SpatialNodeType, string> = {
  site: "bg-violet-100 text-violet-700",
  building: "bg-blue-100 text-blue-700",
  floor: "bg-sky-100 text-sky-700",
  level: "bg-cyan-100 text-cyan-700",
  zone: "bg-emerald-100 text-emerald-700",
  area: "bg-amber-100 text-amber-700",
};

export const NODE_TYPE_ORDER: SpatialNodeType[] = [
  "site",
  "building",
  "floor",
  "level",
  "zone",
  "area",
];
