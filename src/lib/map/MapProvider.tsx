"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import mapboxgl from "mapbox-gl";
import {
  MAP_ACCESS_TOKEN,
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
} from "./map-config";
import { DEFAULT_MAP_STYLE, getStyleUrl, type MapStyleId } from "./map-styles";

export interface MapContextValue {
  map: mapboxgl.Map | null;
  isLoaded: boolean;
  currentStyle: MapStyleId;
  setStyle: (styleId: MapStyleId) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const MapContext = createContext<MapContextValue | null>(null);

export function useMapContext(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error("useMapContext must be used inside <MapProvider>");
  }
  return ctx;
}

interface MapProviderProps {
  children: ReactNode;
}

export function MapProvider({ children }: MapProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<MapStyleId>(DEFAULT_MAP_STYLE);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAP_ACCESS_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: getStyleUrl(DEFAULT_MAP_STYLE),
      center: MAP_DEFAULT_CENTER,
      zoom: MAP_DEFAULT_ZOOM,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.on("load", () => {
      setIsLoaded(true);
    });

    map.on("click", (e) => {
      const lng = parseFloat(e.lngLat.lng.toFixed(6));
      const lat = parseFloat(e.lngLat.lat.toFixed(6));
      const zoom = parseFloat(map.getZoom().toFixed(2));
      console.log("Create spatial node here:", { lng, lat, zoom });
    });

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    mapRef.current = map;

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      setIsLoaded(false);
    };
  }, []);

  const setStyle = useCallback((styleId: MapStyleId) => {
    if (!mapRef.current) return;
    mapRef.current.setStyle(getStyleUrl(styleId));
    setCurrentStyle(styleId);
  }, []);

  return (
    <MapContext.Provider
      value={{
        map: mapRef.current,
        isLoaded,
        currentStyle,
        setStyle,
        containerRef,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}
