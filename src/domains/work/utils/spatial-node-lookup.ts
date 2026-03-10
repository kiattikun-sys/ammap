/**
 * Mock centroid coordinates [lng, lat] keyed by spatialNodeId.
 * These are the approximate centres of the mock zone polygons defined in
 * src/domains/spatial/model/mock-spatial-data.ts.
 * Replace with real geometry lookups once database is connected.
 */
export const MOCK_SPATIAL_NODES_BY_ID: Record<string, [number, number]> = {
  "zone-1": [100.5000, 13.7570],
  "zone-2": [100.5000, 13.7545],
  "zone-3": [100.5043, 13.7558],
  "area-1": [100.4995, 13.7572],
};
