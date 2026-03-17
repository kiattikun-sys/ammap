"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { useMap } from "@/lib/map";
import type { SpatialNodeType } from "@/domains/spatial/model/spatial-node";
import type { SpatialNode } from "@/domains/spatial/model/spatial-node";
import { SpatialDrawingToolbar } from "./spatial-drawing-toolbar";
import { SpatialNodeModal } from "@/features/spatial/components/spatial-node-modal";
import { AssignLocationModal } from "@/features/spatial/components/assign-location-modal";

export interface DrawState {
  activeType: SpatialNodeType | null;
  onStartDrawing: (type: SpatialNodeType) => void;
  onCancelDrawing: () => void;
}

interface SpatialDrawingControllerProps {
  projectId: string;
  existingNodes: SpatialNode[];
  onNodeCreated: (node: SpatialNode) => void;
  onNodeUpdated?: (node: SpatialNode) => void;
  onDrawStateChange?: (state: DrawState) => void;
  hideToolbar?: boolean;
  /** When set: draw mode assigns geometry to this existing node, never creates a new one */
  assignToNode?: SpatialNode | null;
}

interface PendingDraw {
  geometry: GeoJSON.Geometry;
  drawFeatureId: string;
}

export function SpatialDrawingController({
  projectId,
  existingNodes,
  onNodeCreated,
  onNodeUpdated,
  onDrawStateChange,
  hideToolbar = false,
  assignToNode = null,
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

  function clearPending() {
    if (drawRef.current && pending) {
      drawRef.current.delete(pending.drawFeatureId);
    }
    setPending(null);
    setActiveType(null);
  }

  function handleCreateSaved(node: SpatialNode) {
    clearPending();
    onNodeCreated(node);
  }

  function handleAssignSaved(node: SpatialNode) {
    clearPending();
    onNodeUpdated?.(node);
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

      {/* Assign geometry to EXISTING node — never creates a new node */}
      {pending && assignToNode && (
        <AssignLocationModal
          node={assignToNode}
          geometry={pending.geometry}
          onSaved={handleAssignSaved}
          onCancel={clearPending}
        />
      )}

      {/* Create NEW node with geometry — only when not in assign mode */}
      {pending && activeType && !assignToNode && (
        <SpatialNodeModal
          projectId={projectId}
          nodeType={activeType}
          geometry={pending.geometry}
          existingNodes={existingNodes}
          onSaved={handleCreateSaved}
          onCancel={clearPending}
        />
      )}
    </>
  );
}
