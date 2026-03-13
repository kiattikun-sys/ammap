"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { useMap } from "@/lib/map";
import type { SpatialNodeType } from "@/domains/spatial/model/spatial-node";
import type { SpatialNode } from "@/domains/spatial/model/spatial-node";
import { SpatialDrawingToolbar } from "./spatial-drawing-toolbar";
import { SpatialNodeModal } from "@/features/spatial/components/spatial-node-modal";

export interface DrawState {
  activeType: SpatialNodeType | null;
  onStartDrawing: (type: SpatialNodeType) => void;
  onCancelDrawing: () => void;
}

interface SpatialDrawingControllerProps {
  projectId: string;
  existingNodes: SpatialNode[];
  onNodeCreated: (node: SpatialNode) => void;
  onDrawStateChange?: (state: DrawState) => void;
  hideToolbar?: boolean;
}

interface PendingDraw {
  geometry: GeoJSON.Geometry;
  drawFeatureId: string;
}

export function SpatialDrawingController({
  projectId,
  existingNodes,
  onNodeCreated,
  onDrawStateChange,
  hideToolbar = false,
}: SpatialDrawingControllerProps) {
  const { map, isLoaded } = useMap();
  const drawRef = useRef<MapboxDraw | null>(null);
  const [activeType, setActiveType] = useState<SpatialNodeType | null>(null);
  const [pending, setPending] = useState<PendingDraw | null>(null);

  useEffect(() => {
    if (!map || !isLoaded) return;
    if (drawRef.current) return;
    const m = map;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
    });

    m.addControl(draw);
    drawRef.current = draw;

    function onDrawCreate(e: { features: GeoJSON.Feature[] }) {
      const feature = e.features[0];
      if (!feature || !feature.geometry) return;
      setPending({
        geometry: feature.geometry,
        drawFeatureId: feature.id as string,
      });
    }

    (m as any).on("draw.create", onDrawCreate);

    return () => {
      (m as any).off("draw.create", onDrawCreate);
      if (drawRef.current) {
        try {
          m.removeControl(drawRef.current);
        } catch {
          // map may already be destroyed
        }
        drawRef.current = null;
      }
    };
  }, [map, isLoaded]);

  const onDrawStateChangeRef = useRef(onDrawStateChange);
  useEffect(() => { onDrawStateChangeRef.current = onDrawStateChange; });

  const handleStartDrawing = useCallback((type: SpatialNodeType) => {
    if (!drawRef.current) return;
    setActiveType(type);
    drawRef.current.changeMode("draw_polygon");
  }, []);

  const handleCancelDrawing = useCallback(() => {
    if (!drawRef.current) return;
    drawRef.current.changeMode("simple_select");
    drawRef.current.deleteAll();
    setActiveType(null);
    setPending(null);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    onDrawStateChangeRef.current?.({
      activeType,
      onStartDrawing: handleStartDrawing,
      onCancelDrawing: handleCancelDrawing,
    });
  }, [activeType, isLoaded, handleStartDrawing, handleCancelDrawing]);

  function handleModalSaved(node: SpatialNode) {
    if (drawRef.current && pending) {
      drawRef.current.delete(pending.drawFeatureId);
    }
    setPending(null);
    setActiveType(null);
    onNodeCreated(node);
  }

  function handleModalCancel() {
    if (drawRef.current && pending) {
      drawRef.current.delete(pending.drawFeatureId);
    }
    setPending(null);
    setActiveType(null);
  }

  if (!isLoaded) return null;

  return (
    <>
      {!hideToolbar && (
        <SpatialDrawingToolbar
          activeType={activeType}
          onStartDrawing={handleStartDrawing}
          onCancelDrawing={handleCancelDrawing}
        />
      )}

      {pending && activeType && (
        <SpatialNodeModal
          projectId={projectId}
          nodeType={activeType}
          geometry={pending.geometry}
          existingNodes={existingNodes}
          onSaved={handleModalSaved}
          onCancel={handleModalCancel}
        />
      )}
    </>
  );
}
