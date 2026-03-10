import type mapboxgl from "mapbox-gl";
import { SpatialRenderer, type SpatialRendererOptions } from "./spatial-renderer";
import type { LayerDefinition } from "../layers/layer-types";

const DEFECT_SOURCE_ID = "defects-source";
const DEFECT_CIRCLE_LAYER_ID = "defects-circle";
const DEFECT_LABEL_LAYER_ID = "defects-label";

export class DefectRenderer extends SpatialRenderer {
  constructor(options: SpatialRendererOptions) {
    super(options);
  }

  render(data: GeoJSON.FeatureCollection): void {
    if (!this.map.getSource(DEFECT_SOURCE_ID)) {
      this.map.addSource(DEFECT_SOURCE_ID, {
        type: "geojson",
        data,
      });
    } else {
      (this.map.getSource(DEFECT_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(data);
    }

    if (!this.map.getLayer(DEFECT_CIRCLE_LAYER_ID)) {
      this.map.addLayer({
        id: DEFECT_CIRCLE_LAYER_ID,
        type: "circle",
        source: DEFECT_SOURCE_ID,
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 6,
            15, 12,
            18, 16,
          ],
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.95,
        },
      });
    }

    if (!this.map.getLayer(DEFECT_LABEL_LAYER_ID)) {
      this.map.addLayer({
        id: DEFECT_LABEL_LAYER_ID,
        type: "symbol",
        source: DEFECT_SOURCE_ID,
        layout: {
          "text-field": ["get", "title"],
          "text-size": 10,
          "text-anchor": "top",
          "text-offset": [0, 1.2],
          "text-optional": true,
        },
        paint: {
          "text-color": "#1e293b",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        },
      });
    }

    const circleDef: LayerDefinition = {
      id: DEFECT_CIRCLE_LAYER_ID,
      label: "Defects",
      type: "circle",
      visible: true,
      sourceId: DEFECT_SOURCE_ID,
    };
    this.layerManager.register(circleDef);
  }

  clear(): void {
    for (const id of [DEFECT_CIRCLE_LAYER_ID, DEFECT_LABEL_LAYER_ID]) {
      if (this.map.getLayer(id)) this.map.removeLayer(id);
    }
    if (this.map.getSource(DEFECT_SOURCE_ID)) {
      this.map.removeSource(DEFECT_SOURCE_ID);
    }
  }
}
