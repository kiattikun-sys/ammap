import type mapboxgl from "mapbox-gl";
import { SpatialRenderer, type SpatialRendererOptions } from "./spatial-renderer";
import { LayerDefinition } from "../layers/layer-types";

const ZONE_SOURCE_ID = "zones-source";
const ZONE_FILL_LAYER_ID = "zones-fill";
const ZONE_LINE_LAYER_ID = "zones-line";
const ZONE_LABEL_LAYER_ID = "zones-label";

export class ZoneRenderer extends SpatialRenderer {
  constructor(options: SpatialRendererOptions) {
    super(options);
  }

  render(data: GeoJSON.FeatureCollection): void {
    if (!this.map.getSource(ZONE_SOURCE_ID)) {
      this.map.addSource(ZONE_SOURCE_ID, {
        type: "geojson",
        data,
      });
    } else {
      (this.map.getSource(ZONE_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(data);
    }

    if (!this.map.getLayer(ZONE_FILL_LAYER_ID)) {
      this.map.addLayer({
        id: ZONE_FILL_LAYER_ID,
        type: "fill",
        source: ZONE_SOURCE_ID,
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.25,
        },
      });
    }

    if (!this.map.getLayer(ZONE_LINE_LAYER_ID)) {
      this.map.addLayer({
        id: ZONE_LINE_LAYER_ID,
        type: "line",
        source: ZONE_SOURCE_ID,
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2,
          "line-opacity": 0.8,
        },
      });
    }

    if (!this.map.getLayer(ZONE_LABEL_LAYER_ID)) {
      this.map.addLayer({
        id: ZONE_LABEL_LAYER_ID,
        type: "symbol",
        source: ZONE_SOURCE_ID,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#1e293b",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        },
      });
    }

    const fillDef: LayerDefinition = {
      id: ZONE_FILL_LAYER_ID,
      label: "Zones (Fill)",
      type: "fill",
      visible: true,
      sourceId: ZONE_SOURCE_ID,
    };
    const lineDef: LayerDefinition = {
      id: ZONE_LINE_LAYER_ID,
      label: "Zones (Border)",
      type: "line",
      visible: true,
      sourceId: ZONE_SOURCE_ID,
    };
    this.layerManager.register(fillDef);
    this.layerManager.register(lineDef);
  }

  clear(): void {
    for (const id of [ZONE_FILL_LAYER_ID, ZONE_LINE_LAYER_ID, ZONE_LABEL_LAYER_ID]) {
      if (this.map.getLayer(id)) this.map.removeLayer(id);
    }
    if (this.map.getSource(ZONE_SOURCE_ID)) {
      this.map.removeSource(ZONE_SOURCE_ID);
    }
  }
}
