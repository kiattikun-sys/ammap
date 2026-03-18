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
  /** Load an existing geometry into draw for vertex editing (edit-location mode) */
  onStartEditing: (type: SpatialNodeType, existingGeometry: GeoJSON.Geometry) => void;
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
  /** true when loaded from existing geometry (edit mode) vs freshly drawn (draw mode) */
  isEdit: boolean;
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
        isEdit: false,
      });
    }

    // draw.update fires when user moves/adjusts vertices of an existing loaded feature
    function onDrawUpdate(e: { features: GeoJSON.Feature[]; action: string }) {
      const feature = e.features[0];
      if (!feature || !feature.geometry) return;
      setPending((prev) => {
        if (!prev) return prev;
        return { ...prev, geometry: feature.geometry! };
      });
    }

    (m as any).on("draw.create", onDrawCreate);
    (m as any).on("draw.update", onDrawUpdate);

    return () => {
      (m as any).off("draw.create", onDrawCreate);
      (m as any).off("draw.update", onDrawUpdate);
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
    drawRef.current.deleteAll();
    setActiveType(type);
    drawRef.current.changeMode("draw_polygon");
  }, []);

  // Load existing geometry into draw for vertex editing (edit-location mode)
  const handleStartEditing = useCallback((type: SpatialNodeType, existingGeometry: GeoJSON.Geometry) => {
    const draw = drawRef.current;
    if (!draw) return;

    draw.deleteAll();
    setActiveType(type);

    // Normalize MultiPolygon to first Polygon for editing simplicity
    let geomToLoad: GeoJSON.Polygon;
    if (existingGeometry.type === "Polygon") {
      geomToLoad = existingGeometry as GeoJSON.Polygon;
    } else if (existingGeometry.type === "MultiPolygon") {
      geomToLoad = {
        type: "Polygon",
        coordinates: (existingGeometry as GeoJSON.MultiPolygon).coordinates[0],
      };
    } else {
      // Unsupported geometry type — fall back to fresh draw
      draw.changeMode("draw_polygon");
      return;
    }

    const feature: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: "Feature",
      id: "edit-target",
      geometry: geomToLoad,
      properties: {},
    };

    const ids = draw.add(feature as any);
    const featureId = ids[0] as string;

    // Enter direct_select so user can drag individual vertices immediately
    draw.changeMode("direct_select", { featureId });

    // Register the loaded feature as pending so save is available immediately
    setPending({ geometry: geomToLoad, drawFeatureId: featureId, isEdit: true });
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
      onStartEditing: handleStartEditing,
      onCancelDrawing: handleCancelDrawing,
    });
  }, [activeType, isLoaded, handleStartDrawing, handleStartEditing, handleCancelDrawing]);

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
