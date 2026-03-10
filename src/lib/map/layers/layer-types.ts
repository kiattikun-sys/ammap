export type LayerType = "fill" | "line" | "circle" | "symbol" | "heatmap";

export interface LayerDefinition {
  id: string;
  label: string;
  type: LayerType;
  visible: boolean;
  sourceId: string;
}

export interface LayerVisibilityChange {
  layerId: string;
  visible: boolean;
}
