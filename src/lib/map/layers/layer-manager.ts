import type mapboxgl from "mapbox-gl";
import type { LayerDefinition } from "./layer-types";

export class LayerManager {
  private map: mapboxgl.Map;
  private layers: Map<string, LayerDefinition> = new Map();

  constructor(map: mapboxgl.Map) {
    this.map = map;
  }

  register(layer: LayerDefinition): void {
    this.layers.set(layer.id, layer);
  }

  setVisibility(layerId: string, visible: boolean): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;

    layer.visible = visible;
    this.layers.set(layerId, layer);

    if (this.map.getLayer(layerId)) {
      this.map.setLayoutProperty(
        layerId,
        "visibility",
        visible ? "visible" : "none"
      );
    }
  }

  toggleVisibility(layerId: string): void {
    const layer = this.layers.get(layerId);
    if (!layer) return;
    this.setVisibility(layerId, !layer.visible);
  }

  updateSourceData(
    sourceId: string,
    data: GeoJSON.FeatureCollection
  ): void {
    const source = this.map.getSource(sourceId);
    if (source && source.type === "geojson") {
      (source as mapboxgl.GeoJSONSource).setData(data);
    }
  }

  getLayer(layerId: string): LayerDefinition | undefined {
    return this.layers.get(layerId);
  }

  getAllLayers(): LayerDefinition[] {
    return Array.from(this.layers.values());
  }

  isVisible(layerId: string): boolean {
    return this.layers.get(layerId)?.visible ?? false;
  }
}
