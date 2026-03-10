import type mapboxgl from "mapbox-gl";
import type { LayerManager } from "../layers/layer-manager";

export interface SpatialRendererOptions {
  map: mapboxgl.Map;
  layerManager: LayerManager;
}

export abstract class SpatialRenderer {
  protected map: mapboxgl.Map;
  protected layerManager: LayerManager;

  constructor({ map, layerManager }: SpatialRendererOptions) {
    this.map = map;
    this.layerManager = layerManager;
  }

  abstract render(data: GeoJSON.FeatureCollection): void;
  abstract clear(): void;
}
