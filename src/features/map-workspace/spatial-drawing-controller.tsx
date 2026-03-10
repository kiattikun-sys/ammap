"use client";

import { useEffect, useRef, useState } from "react";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { useMap } from "@/lib/map";
import type { SpatialNodeType } from "@/domains/spatial/model/spatial-node";
import type { SpatialNode } from "@/domains/spatial/model/spatial-node";
import { SpatialDrawingToolbar } from "./spatial-drawing-toolbar";
import { SpatialNodeModal } from "@/features/spatial/components/spatial-node-modal";

interface SpatialDrawingControllerProps {
  projectId: string;
  existingNodes: SpatialNode[];
  onNodeCreated: (node: SpatialNode) => void;
}

interface PendingDraw {
  geometry: GeoJSON.Geometry;
  drawFeatureId: string;
}

export function SpatialDrawingController({
  projectId,
  existingNodes,
  onNodeCreated,
}: SpatialDrawingControllerProps) {
  const { map, isLoaded } = useMap();
  const drawRef = useRef<MapboxDraw | null>(null);
  const [activeType, setActiveType] = useState<SpatialNodeType | null>(null);
  const [pending, setPending] = useState<PendingDraw | null>(null);

  useEffect(() => {
    if (!map || !isLoaded) return;
    if (drawRef.current) return;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
    });

    map.addControl(draw);
    drawRef.current = draw;

    function onDrawCreate(e: { features: GeoJSON.Feature[] }) {
      const feature = e.features[0];
      if (!feature || !feature.geometry) return;
      setPending({
        geometry: feature.geometry,
        drawFeatureId: feature.id as string,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (map as any).on("draw.create", onDrawCreate);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any).off("draw.create", onDrawCreate);
      if (drawRef.current) {
        map.removeControl(drawRef.current);
        drawRef.current = null;
      }
    };
  }, [map, isLoaded]);

  function handleStartDrawing(type: SpatialNodeType) {
    if (!drawRef.current) return;
    setActiveType(type);
    drawRef.current.changeMode("draw_polygon");
  }

  function handleCancelDrawing() {
    if (!drawRef.current) return;
    drawRef.current.changeMode("simple_select");
    drawRef.current.deleteAll();
    setActiveType(null);
    setPending(null);
  }

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
      <SpatialDrawingToolbar
        activeType={activeType}
        onStartDrawing={handleStartDrawing}
        onCancelDrawing={handleCancelDrawing}
      />

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
