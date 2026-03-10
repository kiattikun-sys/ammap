export type SpatialNodeType =
  | "site"
  | "building"
  | "floor"
  | "zone"
  | "area";

export interface SpatialNode {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  type: SpatialNodeType;
  geometry: GeoJSON.Geometry | null;
  geometryId: string | null;
  level: number;
  order: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
