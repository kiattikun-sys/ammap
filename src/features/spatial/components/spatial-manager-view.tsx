"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { listSpatialNodes } from "@/domains/spatial/queries/list-spatial-nodes";
import type { SpatialNode, SpatialNodeType } from "@/domains/spatial/model/spatial-node";
import { SpatialTree } from "./spatial-tree";
import {
  NODE_TYPE_LABELS,
  NODE_TYPE_COLORS,
} from "@/domains/spatial/services/spatial-drawing-service";
import { MapProvider, useMap } from "@/lib/map";
import { MapContainer } from "@/features/map-workspace/map-container";
import type { DrawState } from "@/features/map-workspace/spatial-drawing-controller";
import { SpatialDrawingController } from "@/features/map-workspace/spatial-drawing-controller";
import mapboxgl from "mapbox-gl";
import {
  MapPin, Layers, ChevronRight, Eye, Trash2,
  MapPinOff, CheckCircle2, AlertCircle,
} from "lucide-react";
import { deleteSpatialNode } from "@/domains/spatial/actions/delete-spatial-node";

interface SpatialManagerViewProps {
  projectId: string;
}

// ─── Field-worker friendly labels ────────────────────────────────────────────
const AREA_TYPE_LABELS: Record<SpatialNodeType, string> = {
  site: "Site",
  building: "Building",
  floor: "Floor",
  level: "Level",
  zone: "Zone",
  area: "Area",
};

// ─── Main component ────────────────────────────────────────────────────────
export function SpatialManagerView({ projectId }: SpatialManagerViewProps) {
  const [nodes, setNodes] = useState<SpatialNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listSpatialNodes({ projectId })
      .then(setNodes)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load areas"))
      .finally(() => setLoading(false));
  }, [projectId]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  function handleNodeCreated(node: SpatialNode) {
    setNodes((prev) => [...prev, node]);
    setSelectedNodeId(node.id);
  }

  function handleNodesChange(updated: SpatialNode[]) {
    setNodes(updated);
  }

  return (
    <MapProvider>
      <SpatialPageInner
        projectId={projectId}
        nodes={nodes}
        selectedNodeId={selectedNodeId}
        loading={loading}
        error={error}
        selectedNode={selectedNode}
        onSelectNode={setSelectedNodeId}
        onNodesChange={handleNodesChange}
        onNodeCreated={handleNodeCreated}
      />
    </MapProvider>
  );
}

// ─── Inner: needs map context ──────────────────────────────────────────────
interface InnerProps {
  projectId: string;
  nodes: SpatialNode[];
  selectedNodeId: string | null;
  loading: boolean;
  error: string | null;
  selectedNode: SpatialNode | null;
  onSelectNode: (id: string | null) => void;
  onNodesChange: (nodes: SpatialNode[]) => void;
  onNodeCreated: (node: SpatialNode) => void;
}

function SpatialPageInner({
  projectId,
  nodes,
  selectedNodeId,
  loading,
  error,
  selectedNode,
  onSelectNode,
  onNodesChange,
  onNodeCreated,
}: InnerProps) {
  const { map, isLoaded } = useMap();
  const [drawState, setDrawState] = useState<DrawState | null>(null);
  const hasFitRef = useRef(false);

  // ── Auto fit-bounds on first load ─────────────────────────────────────
  useEffect(() => {
    if (!map || !isLoaded || nodes.length === 0 || hasFitRef.current) return;
    const allCoords: number[][] = [];
    for (const node of nodes) {
      if (!node.geometry) continue;
      const geom = node.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
      if (geom.type === "Polygon") allCoords.push(...geom.coordinates[0]);
      else if (geom.type === "MultiPolygon")
        for (const poly of geom.coordinates) allCoords.push(...poly[0]);
    }
    if (!allCoords.length) return;
    hasFitRef.current = true;
    const lngs = allCoords.map((c) => c[0]);
    const lats = allCoords.map((c) => c[1]);
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 80, duration: 800, maxZoom: 18 }
    );
  }, [map, isLoaded, nodes]);

  // ── Fly to selected node ──────────────────────────────────────────────
  useEffect(() => {
    if (!map || !isLoaded || !selectedNodeId) return;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node?.geometry) return;
    const geom = node.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    const coords: number[][] =
      geom.type === "Polygon"
        ? geom.coordinates[0]
        : geom.coordinates.flat(2).reduce<number[][]>((acc, _, i, arr) =>
            i % 2 === 0 ? [...acc, [arr[i] as unknown as number, arr[i + 1] as unknown as number]] : acc,
            []
          );
    if (!coords.length) return;
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 100, duration: 700, maxZoom: 19 }
    );
  }, [map, isLoaded, selectedNodeId, nodes]);

  // ── Draw polygon layers for all nodes ─────────────────────────────────
  useEffect(() => {
    if (!map || !isLoaded) return;
    const SOURCE = "spatial-mgr-source";
    const FILL = "spatial-mgr-fill";
    const LINE = "spatial-mgr-line";
    const LABEL = "spatial-mgr-label";

    const features: GeoJSON.Feature[] = nodes
      .filter((n) => n.geometry)
      .map((n) => ({
        type: "Feature" as const,
        geometry: n.geometry as GeoJSON.Geometry,
        properties: {
          id: n.id,
          name: n.name,
          type: n.type,
          selected: n.id === selectedNodeId,
        },
      }));

    const geojson: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };

    if (!map.getSource(SOURCE)) {
      map.addSource(SOURCE, { type: "geojson", data: geojson });
      map.addLayer({
        id: FILL, type: "fill", source: SOURCE,
        paint: {
          "fill-color": [
            "match", ["get", "type"],
            "site", "#7c3aed", "building", "#2563eb",
            "floor", "#0284c7", "level", "#0891b2",
            "zone", "#059669", "area", "#d97706", "#94a3b8",
          ],
          "fill-opacity": ["case", ["get", "selected"], 0.35, 0.1],
        },
      });
      map.addLayer({
        id: LINE, type: "line", source: SOURCE,
        paint: {
          "line-color": [
            "match", ["get", "type"],
            "site", "#7c3aed", "building", "#2563eb",
            "floor", "#0284c7", "level", "#0891b2",
            "zone", "#059669", "area", "#d97706", "#94a3b8",
          ],
          "line-width": ["case", ["get", "selected"], 3, 1.5],
          "line-opacity": ["case", ["get", "selected"], 1.0, 0.65],
        },
      });
      map.addLayer({
        id: LABEL, type: "symbol", source: SOURCE,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#1e293b",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        },
      });

      // Map → Tree click sync
      map.on("click", FILL, (e) => {
        const id = e.features?.[0]?.properties?.["id"] as string | undefined;
        if (id) onSelectNode(id);
      });
      map.on("mouseenter", FILL, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", FILL, () => { map.getCanvas().style.cursor = ""; });
    } else {
      (map.getSource(SOURCE) as mapboxgl.GeoJSONSource).setData(geojson);
      // update selection paint
      if (map.getLayer(FILL)) {
        map.setPaintProperty(FILL, "fill-opacity", ["case", ["get", "selected"], 0.35, 0.1]);
      }
      if (map.getLayer(LINE)) {
        map.setPaintProperty(LINE, "line-width", ["case", ["get", "selected"], 3, 1.5]);
        map.setPaintProperty(LINE, "line-opacity", ["case", ["get", "selected"], 1.0, 0.65]);
      }
    }

    return () => {
      // cleanup only on unmount, not on every node update
    };
  }, [map, isLoaded, nodes, selectedNodeId]);

  // ── Start drawing from detail panel button ────────────────────────────
  const handleAddLocation = useCallback((type: SpatialNodeType) => {
    drawState?.onStartDrawing(type);
  }, [drawState]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50">
      {/* ── LEFT: Project Structure Tree ──────────────────────────────── */}
      <div className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <Layers size={15} className="text-slate-400" />
          <span className="text-sm font-bold text-slate-800">Project Structure</span>
        </div>
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              {error}
            </div>
          </div>
        ) : (
          <SpatialTree
            projectId={projectId}
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
            onNodesChange={onNodesChange}
          />
        )}
      </div>

      {/* ── CENTER: Map ────────────────────────────────────────────────── */}
      <div className="relative flex-1">
        <MapContainer />

        {/* Drawing toolbar overlay */}
        {drawState?.activeType && (
          <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2">
            <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-lg border border-slate-200">
              <span className="text-xs font-semibold text-blue-700">
                Drawing {AREA_TYPE_LABELS[drawState.activeType]} — draw a polygon on the map
              </span>
              <button
                type="button"
                onClick={drawState.onCancelDrawing}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Drawing controller (hidden toolbar — managed by detail panel) */}
        <SpatialDrawingController
          projectId={projectId}
          existingNodes={nodes}
          hideToolbar
          onDrawStateChange={setDrawState}
          onNodeCreated={onNodeCreated}
        />
      </div>

      {/* ── RIGHT: Area Details ────────────────────────────────────────── */}
      <div className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white overflow-y-auto">
        {selectedNode ? (
          <AreaDetailPanel
            node={selectedNode}
            allNodes={nodes}
            onNodesChange={onNodesChange}
            onSelectNode={onSelectNode}
            onAddLocation={handleAddLocation}
          />
        ) : (
          <EmptyDetail nodeCount={nodes.length} />
        )}
      </div>
    </div>
  );
}

// ─── Area Detail Panel ─────────────────────────────────────────────────────
interface AreaDetailPanelProps {
  node: SpatialNode;
  allNodes: SpatialNode[];
  onNodesChange: (nodes: SpatialNode[]) => void;
  onSelectNode: (id: string | null) => void;
  onAddLocation: (type: SpatialNodeType) => void;
}

function AreaDetailPanel({ node, allNodes, onNodesChange, onSelectNode, onAddLocation }: AreaDetailPanelProps) {
  const typeKey = node.type as SpatialNodeType;
  const label = AREA_TYPE_LABELS[typeKey] ?? node.type;
  const colorClass = NODE_TYPE_COLORS[typeKey] ?? "bg-slate-100 text-slate-600";
  const hasLocation = Boolean(node.geometry);

  const parent = node.parentId ? allNodes.find((n) => n.id === node.parentId) : null;
  const subAreas = allNodes.filter((n) => n.parentId === node.id).sort((a, b) => a.order - b.order);

  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteSpatialNode(node.id);
      function collectDescendantIds(id: string): string[] {
        const children = allNodes.filter((n) => n.parentId === id);
        return [id, ...children.flatMap((c) => collectDescendantIds(c.id))];
      }
      const toRemove = new Set(collectDescendantIds(node.id));
      onNodesChange(allNodes.filter((n) => !toRemove.has(n.id)));
      onSelectNode(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-100 px-4 py-4">
        {parent && (
          <div className="mb-2 flex items-center gap-1 text-[10px] text-slate-400">
            <span>{AREA_TYPE_LABELS[parent.type as SpatialNodeType]}</span>
            <ChevronRight size={10} />
            <span className="font-semibold text-slate-500">{parent.name}</span>
          </div>
        )}
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${colorClass}`}>
            {label[0]}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-slate-900">{node.name}</h2>
            <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${colorClass}`}>
              {label}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="border-b border-slate-100 px-4 py-4 space-y-3">
        <InfoRow label="Area Type" value={label} />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Location on Map</span>
          {hasLocation ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 size={13} /> Mapped
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
              <MapPinOff size={13} /> Not mapped
            </span>
          )}
        </div>
        <InfoRow label="Sub Areas" value={subAreas.length > 0 ? `${subAreas.length} area${subAreas.length > 1 ? "s" : ""}` : "None"} />
        <InfoRow label="Created" value={node.createdAt.toLocaleDateString("en-CA")} />
        <InfoRow label="Last Updated" value={node.updatedAt.toLocaleDateString("en-CA")} />
      </div>

      {/* Location actions */}
      <div className="border-b border-slate-100 px-4 py-4 space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Map Location</p>
        {hasLocation ? (
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye size={13} className="text-blue-500" />
            View on Map
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAddLocation(node.type as SpatialNodeType)}
            className="flex w-full items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <MapPin size={13} />
            Add Location on Map
          </button>
        )}
      </div>

      {/* Sub areas */}
      {subAreas.length > 0 && (
        <div className="border-b border-slate-100 px-4 py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Sub Areas ({subAreas.length})
          </p>
          <div className="space-y-1.5">
            {subAreas.map((child) => {
              const childType = child.type as SpatialNodeType;
              const childColor = NODE_TYPE_COLORS[childType] ?? "bg-slate-100 text-slate-500";
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => onSelectNode(child.id)}
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-left hover:border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${childColor}`}>
                    {AREA_TYPE_LABELS[childType]?.[0]}
                  </span>
                  <span className="flex-1 truncate text-xs font-medium text-slate-800">{child.name}</span>
                  {child.geometry ? (
                    <CheckCircle2 size={11} className="shrink-0 text-emerald-400" />
                  ) : (
                    <MapPinOff size={11} className="shrink-0 text-slate-300" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete */}
      <div className="mt-auto px-4 py-4">
        {deleteError && (
          <p className="mb-2 text-xs text-red-500">{deleteError}</p>
        )}
        {confirmDelete ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, Delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex w-full items-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={12} />
            Delete Area
          </button>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function EmptyDetail({ nodeCount }: { nodeCount: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      {nodeCount === 0 ? (
        <>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Layers size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No areas yet</p>
          <p className="mt-1 text-xs text-slate-400 max-w-[200px]">
            Use the Project Structure panel to add your first Site or Building
          </p>
        </>
      ) : (
        <>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <MapPin size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Select an area</p>
          <p className="mt-1 text-xs text-slate-400">
            Click any area in the Project Structure to view its details
          </p>
        </>
      )}
    </div>
  );
}
