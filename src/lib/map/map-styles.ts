export type MapStyleId = "satellite" | "streets" | "light" | "dark";

export interface MapStyleOption {
  id: MapStyleId;
  label: string;
  url: string;
}

export const MAP_STYLES: MapStyleOption[] = [
  {
    id: "streets",
    label: "Streets",
    url: "mapbox://styles/mapbox/streets-v12",
  },
  {
    id: "satellite",
    label: "Satellite",
    url: "mapbox://styles/mapbox/satellite-streets-v12",
  },
  {
    id: "light",
    label: "Light",
    url: "mapbox://styles/mapbox/light-v11",
  },
  {
    id: "dark",
    label: "Dark",
    url: "mapbox://styles/mapbox/dark-v11",
  },
];

export const DEFAULT_MAP_STYLE: MapStyleId = "streets";

export function getStyleUrl(id: MapStyleId): string {
  const style = MAP_STYLES.find((s) => s.id === id);
  return style?.url ?? MAP_STYLES[0].url;
}
