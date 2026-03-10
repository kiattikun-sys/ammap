export type SpatialGeometryType = "polygon" | "line" | "point";

export interface SpatialGeometry {
  id: string;
  type: SpatialGeometryType;
  geojson: GeoJSON.Geometry;
  bbox: [number, number, number, number] | null;
  createdAt: Date;
}
