export const MAP_ACCESS_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export const MAP_DEFAULT_CENTER: [number, number] = [100.5018, 13.7563]; // Bangkok

export const MAP_DEFAULT_ZOOM = 13;

export const MAP_MIN_ZOOM = 2;
export const MAP_MAX_ZOOM = 22;

export const MAP_PROJECTION = "mercator" as const;
