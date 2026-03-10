import type mapboxgl from "mapbox-gl";
import { SpatialRenderer, type SpatialRendererOptions } from "./spatial-renderer";
import type { LayerDefinition } from "../layers/layer-types";

const TASK_SOURCE_ID = "tasks-source";
const TASK_CIRCLE_LAYER_ID = "tasks-circle";
const TASK_LABEL_LAYER_ID = "tasks-label";

export class TaskRenderer extends SpatialRenderer {
  constructor(options: SpatialRendererOptions) {
    super(options);
  }

  render(data: GeoJSON.FeatureCollection): void {
    if (!this.map.getSource(TASK_SOURCE_ID)) {
      this.map.addSource(TASK_SOURCE_ID, {
        type: "geojson",
        data,
      });
    } else {
      (this.map.getSource(TASK_SOURCE_ID) as mapboxgl.GeoJSONSource).setData(data);
    }

    if (!this.map.getLayer(TASK_CIRCLE_LAYER_ID)) {
      this.map.addLayer({
        id: TASK_CIRCLE_LAYER_ID,
        type: "circle",
        source: TASK_SOURCE_ID,
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 5,
            15, 10,
            18, 14,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
      });
    }

    if (!this.map.getLayer(TASK_LABEL_LAYER_ID)) {
      this.map.addLayer({
        id: TASK_LABEL_LAYER_ID,
        type: "symbol",
        source: TASK_SOURCE_ID,
        layout: {
          "text-field": ["get", "title"],
          "text-size": 10,
          "text-anchor": "top",
          "text-offset": [0, 1],
          "text-optional": true,
        },
        paint: {
          "text-color": "#1e293b",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        },
      });
    }

    const circleDef: LayerDefinition = {
      id: TASK_CIRCLE_LAYER_ID,
      label: "Tasks",
      type: "circle",
      visible: true,
      sourceId: TASK_SOURCE_ID,
    };
    this.layerManager.register(circleDef);
  }

  clear(): void {
    for (const id of [TASK_CIRCLE_LAYER_ID, TASK_LABEL_LAYER_ID]) {
      if (this.map.getLayer(id)) this.map.removeLayer(id);
    }
    if (this.map.getSource(TASK_SOURCE_ID)) {
      this.map.removeSource(TASK_SOURCE_ID);
    }
  }
}
