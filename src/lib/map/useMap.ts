"use client";

import { useMapContext } from "./MapProvider";

export function useMap() {
  return useMapContext();
}
