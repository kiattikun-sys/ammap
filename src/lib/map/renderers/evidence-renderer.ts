import type mapboxgl from "mapbox-gl";
import { SpatialRenderer, type SpatialRendererOptions } from "./spatial-renderer";
import type { LayerDefinition } from "../layers/layer-types";

const EVIDENCE_SOURCE_ID = "evidence-source";
const EVIDENCE_CIRCLE_LAYER_ID = "evidence-circle";
const EVIDENCE_LABEL_LAYER_ID = "evidence-label";

export class EvidenceRenderer extends SpatialRenderer {
  constructor(options: SpatialRendererOptions) {
    super(options);
  }

  render(data: GeoJSON.FeatureCollection): void {
    if (!this.map.getSource(EVIDENCE_SOURCE_ID)) {
      this.map.addSource(EVIDENCE_SOURCE_ID, {
        type: "geojson",
        data,
      });
    } else {
      (
        this.map.getSource(EVIDENCE_SOURCE_ID) as mapboxgl.GeoJSONSource
      ).setData(data);
    }

    if (!this.map.getLayer(EVIDENCE_CIRCLE_LAYER_ID)) {
      this.map.addLayer({
        id: EVIDENCE_CIRCLE_LAYER_ID,
        type: "circle",
        source: EVIDENCE_SOURCE_ID,
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10, 4,
            15, 9,
            18, 13,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
      });
    }

    if (!this.map.getLayer(EVIDENCE_LABEL_LAYER_ID)) {
      this.map.addLayer({
        id: EVIDENCE_LABEL_LAYER_ID,
        type: "symbol",
        source: EVIDENCE_SOURCE_ID,
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
      id: EVIDENCE_CIRCLE_LAYER_ID,
      label: "Evidence",
      type: "circle",
      visible: true,
      sourceId: EVIDENCE_SOURCE_ID,
    };
    this.layerManager.register(circleDef);
  }

  clear(): void {
    for (const id of [EVIDENCE_CIRCLE_LAYER_ID, EVIDENCE_LABEL_LAYER_ID]) {
      if (this.map.getLayer(id)) this.map.removeLayer(id);
    }
    if (this.map.getSource(EVIDENCE_SOURCE_ID)) {
      this.map.removeSource(EVIDENCE_SOURCE_ID);
    }
  }
}
