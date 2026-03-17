"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { listSpatialNodes } from "@/domains/spatial/queries/list-spatial-nodes";
import type { SpatialNode, SpatialNodeType } from "@/domains/spatial/model/spatial-node";
import { SpatialTree } from "./spatial-tree";
import { CreateNodeDialog } from "./create-node-dialog";
import { EditAreaModal } from "./edit-area-modal";
import {
  NODE_TYPE_COLORS,
} from "@/domains/spatial/services/spatial-drawing-service";
import { MapProvider, useMap } from "@/lib/map";
import { MapContainer } from "@/features/map-workspace/map-container";
import type { DrawState } from "@/features/map-workspace/spatial-drawing-controller";
import { SpatialDrawingController } from "@/features/map-workspace/spatial-drawing-controller";
import mapboxgl from "mapbox-gl";
import {
  MapPin, Layers, ChevronRight, Eye, Trash2, Plus,
  MapPinOff, CheckCircle2, AlertCircle, Pencil,
} from "lucide-react";
import { deleteSpatialNode } from "@/domains/spatial/actions/delete-spatial-node";
import type { SpatialTreeNode } from "@/domains/spatial/queries/get-spatial-tree";

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

// ─── Page mode state machine ───────────────────────────────────────────────
type PageMode =
  | { type: "idle" }
  | { type: "creating-area"; parentNode: SpatialTreeNode | null }
  | { type: "creating-sub-area"; parentNode: SpatialTreeNode }
  | { type: "adding-location"; targetNode: SpatialNode }
  | { type: "editing-location"; targetNode: SpatialNode }
  | { type: "editing-area"; targetNode: SpatialNode }
  | { type: "confirm-delete"; targetNode: SpatialNode };

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
      .catch((err) => setError(err instanceof Error ? err.message : "โหลดข้อมูลล้มเหลว"))
      .finally(() => setLoading(false));
  }, [projectId]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  function handleNodeCreated(node: SpatialNode) {
    setNodes((prev) => [...prev, node]);
    setSelectedNodeId(node.id);
  }

  function handleNodeUpdated(node: SpatialNode) {
    setNodes((prev) => prev.map((n) => (n.id === node.id ? node : n)));
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
        onNodesChange={setNodes}
        onNodeCreated={handleNodeCreated}
        onNodeUpdated={handleNodeUpdated}
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
  onNodeUpdated: (node: SpatialNode) => void;
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
  onNodeUpdated,
}: InnerProps) {
  const { map, isLoaded } = useMap();
  const [drawState, setDrawState] = useState<DrawState | null>(null);
  const [mode, setMode] = useState<PageMode>({ type: "idle" });
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

  // ── Fly to selected node when it has geometry ─────────────────────────
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
        properties: { id: n.id, name: n.name, type: n.type, selected: n.id === selectedNodeId },
      }));
    const geojson: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };

    if (!map.getSource(SOURCE)) {
      map.addSource(SOURCE, { type: "geojson", data: geojson });
      map.addLayer({
        id: FILL, type: "fill", source: SOURCE,
        paint: {
          "fill-color": ["match", ["get", "type"],
            "site", "#7c3aed", "building", "#2563eb", "floor", "#0284c7",
            "level", "#0891b2", "zone", "#059669", "area", "#d97706", "#94a3b8"],
          "fill-opacity": ["case", ["get", "selected"], 0.35, 0.1],
        },
      });
      map.addLayer({
        id: LINE, type: "line", source: SOURCE,
        paint: {
          "line-color": ["match", ["get", "type"],
            "site", "#7c3aed", "building", "#2563eb", "floor", "#0284c7",
            "level", "#0891b2", "zone", "#059669", "area", "#d97706", "#94a3b8"],
          "line-width": ["case", ["get", "selected"], 3, 1.5],
          "line-opacity": ["case", ["get", "selected"], 1.0, 0.65],
        },
      });
      map.addLayer({
        id: LABEL, type: "symbol", source: SOURCE,
        layout: { "text-field": ["get", "name"], "text-size": 11, "text-anchor": "center" },
        paint: { "text-color": "#1e293b", "text-halo-color": "#ffffff", "text-halo-width": 1.5 },
      });
      map.on("click", FILL, (e) => {
        const id = e.features?.[0]?.properties?.["id"] as string | undefined;
        if (id) onSelectNode(id);
      });
      map.on("mouseenter", FILL, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", FILL, () => { map.getCanvas().style.cursor = ""; });
    } else {
      (map.getSource(SOURCE) as mapboxgl.GeoJSONSource).setData(geojson);
      if (map.getLayer(FILL)) map.setPaintProperty(FILL, "fill-opacity", ["case", ["get", "selected"], 0.35, 0.1]);
      if (map.getLayer(LINE)) {
        map.setPaintProperty(LINE, "line-width", ["case", ["get", "selected"], 3, 1.5]);
        map.setPaintProperty(LINE, "line-opacity", ["case", ["get", "selected"], 1.0, 0.65]);
      }
    }
  }, [map, isLoaded, nodes, selectedNodeId]);

  // ── Drawing mode effects: start draw when mode changes to adding/editing location ──
  useEffect(() => {
    if (!drawState) return;
    if (mode.type === "adding-location" || mode.type === "editing-location") {
      drawState.onStartDrawing(mode.targetNode.type as SpatialNodeType);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode.type]);

  // ── Cancel draw if mode resets to idle ────────────────────────────────
  useEffect(() => {
    if (mode.type === "idle" && drawState?.activeType) {
      drawState.onCancelDrawing();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode.type]);

  // ── Determine the assignToNode for drawing controller ─────────────────
  const assignToNode =
    (mode.type === "adding-location" || mode.type === "editing-location")
      ? mode.targetNode
      : null;

  // ── View on map: fly to mapped node ───────────────────────────────────
  const handleViewOnMap = useCallback((node: SpatialNode) => {
    if (!map || !isLoaded || !node.geometry) return;
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
  }, [map, isLoaded]);

  // ── Banner label for drawing mode ─────────────────────────────────────
  function getDrawingBanner(): { action: string; nodeName: string } | null {
    if (mode.type === "adding-location") return { action: "กำหนดตำแหน่งสำหรับ:", nodeName: mode.targetNode.name };
    if (mode.type === "editing-location") return { action: "แก้ไขตำแหน่งสำหรับ:", nodeName: mode.targetNode.name };
    return null;
  }
  const drawingBanner = getDrawingBanner();

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-50">
      {/* ── LEFT: Project Structure Tree ──────────────────────────────── */}
      <div className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Layers size={15} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-800">โครงสร้างพื้นที่</span>
          </div>
          <button
            type="button"
            onClick={() => setMode({ type: "creating-area", parentNode: null })}
            title="เพิ่มพื้นที่"
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus size={12} /> เพิ่มพื้นที่
          </button>
        </div>
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />{error}
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

        {/* Drawing mode banner — clearly identifies target node */}
        {drawingBanner && (
          <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2">
            <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lg border border-blue-200">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {drawingBanner.action}
                </span>
                <span className="text-sm font-bold text-blue-700">{drawingBanner.nodeName}</span>
              </div>
              <span className="text-xs text-slate-500">— วาด polygon บนแผนที่</span>
              <button
                type="button"
                onClick={() => setMode({ type: "idle" })}
                className="ml-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {/* Drawing controller — knows whether to create new or assign to existing */}
        <SpatialDrawingController
          projectId={projectId}
          existingNodes={nodes}
          hideToolbar
          onDrawStateChange={setDrawState}
          onNodeCreated={(node) => { onNodeCreated(node); setMode({ type: "idle" }); }}
          onNodeUpdated={(node) => { onNodeUpdated(node); setMode({ type: "idle" }); }}
          assignToNode={assignToNode}
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
            onSetMode={setMode}
            onViewOnMap={handleViewOnMap}
          />
        ) : (
          <EmptyDetail nodeCount={nodes.length} onAddArea={() => setMode({ type: "creating-area", parentNode: null })} />
        )}
      </div>

      {/* ── DIALOGS ───────────────────────────────────────────────────── */}
      {(mode.type === "creating-area" || mode.type === "creating-sub-area") && (
        <CreateNodeDialog
          projectId={projectId}
          allNodes={nodes}
          defaultParent={
            mode.type === "creating-sub-area"
              ? (mode.parentNode as SpatialTreeNode)
              : (mode.type === "creating-area" ? mode.parentNode : null)
          }
          onCreated={(node) => { onNodeCreated(node); setMode({ type: "idle" }); }}
          onClose={() => setMode({ type: "idle" })}
        />
      )}

      {mode.type === "editing-area" && (
        <EditAreaModal
          node={mode.targetNode}
          onSaved={(updated) => { onNodeUpdated(updated); setMode({ type: "idle" }); }}
          onClose={() => setMode({ type: "idle" })}
        />
      )}

      {mode.type === "confirm-delete" && (
        <DeleteConfirmModal
          node={mode.targetNode}
          allNodes={nodes}
          onDeleted={(nodeId) => {
            function collectDescendantIds(id: string): string[] {
              const children = nodes.filter((n) => n.parentId === id);
              return [id, ...children.flatMap((c) => collectDescendantIds(c.id))];
            }
            const toRemove = new Set(collectDescendantIds(nodeId));
            onNodesChange(nodes.filter((n) => !toRemove.has(n.id)));
            onSelectNode(null);
            setMode({ type: "idle" });
          }}
          onClose={() => setMode({ type: "idle" })}
        />
      )}
    </div>
  );
}

// ─── Area Detail Panel ─────────────────────────────────────────────────────
interface AreaDetailPanelProps {
  node: SpatialNode;
  allNodes: SpatialNode[];
  onNodesChange: (nodes: SpatialNode[]) => void;
  onSelectNode: (id: string | null) => void;
  onSetMode: (mode: PageMode) => void;
  onViewOnMap: (node: SpatialNode) => void;
}

function AreaDetailPanel({ node, allNodes, onSelectNode, onSetMode, onViewOnMap }: AreaDetailPanelProps) {
  const typeKey = node.type as SpatialNodeType;
  const label = AREA_TYPE_LABELS[typeKey] ?? node.type;
  const colorClass = NODE_TYPE_COLORS[typeKey] ?? "bg-slate-100 text-slate-600";
  const hasLocation = Boolean(node.geometry);

  const parent = node.parentId ? allNodes.find((n) => n.id === node.parentId) : null;
  const subAreas = allNodes.filter((n) => n.parentId === node.id).sort((a, b) => a.order - b.order);

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
        <InfoRow label="ประเภทพื้นที่" value={label} />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">ตำแหน่งบนแผนที่</span>
          {hasLocation ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 size={13} /> กำหนดแล้ว
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
              <MapPinOff size={13} /> ยังไม่ได้กำหนด
            </span>
          )}
        </div>
        <InfoRow label="พื้นที่ย่อย" value={subAreas.length > 0 ? `${subAreas.length} รายการ` : "ไม่มี"} />
        <InfoRow label="วันที่สร้าง" value={node.createdAt.toLocaleDateString("en-CA")} />
        <InfoRow label="แก้ไขล่าสุด" value={node.updatedAt.toLocaleDateString("en-CA")} />
      </div>

      {/* ── ACTION BUTTONS ─────────────────────────────────────────────── */}
      <div className="border-b border-slate-100 px-4 py-4 space-y-2">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">การดำเนินการ</p>

        {/* Location actions — conditional on geometry */}
        {hasLocation ? (
          <>
            <ActionBtn
              icon={<Eye size={13} className="text-blue-500" />}
              label="ดูบนแผนที่"
              onClick={() => onViewOnMap(node)}
            />
            <ActionBtn
              icon={<Pencil size={13} className="text-amber-500" />}
              label="แก้ไขตำแหน่งบนแผนที่"
              onClick={() => onSetMode({ type: "editing-location", targetNode: node })}
            />
          </>
        ) : (
          <ActionBtn
            icon={<MapPin size={13} className="text-blue-500" />}
            label="กำหนดตำแหน่งบนแผนที่"
            highlight
            onClick={() => onSetMode({ type: "adding-location", targetNode: node })}
          />
        )}

        {/* Area management */}
        <ActionBtn
          icon={<Plus size={13} className="text-emerald-600" />}
          label="เพิ่มพื้นที่ย่อย"
          onClick={() => {
            const asTreeNode = { ...node, children: [] } as SpatialTreeNode;
            onSetMode({ type: "creating-sub-area", parentNode: asTreeNode });
          }}
        />
        <ActionBtn
          icon={<Pencil size={13} className="text-slate-500" />}
          label="แก้ไขข้อมูลพื้นที่"
          onClick={() => onSetMode({ type: "editing-area", targetNode: node })}
        />
      </div>

      {/* Sub areas */}
      {subAreas.length > 0 && (
        <div className="border-b border-slate-100 px-4 py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            พื้นที่ย่อย ({subAreas.length})
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
                    <CheckCircle2 size={11} className="shrink-0 text-emerald-400" aria-label="กำหนดตำแหน่งแล้ว" />
                  ) : (
                    <MapPinOff size={11} className="shrink-0 text-amber-300" aria-label="ยังไม่ได้กำหนดตำแหน่ง" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete — at bottom */}
      <div className="mt-auto px-4 py-4">
        <button
          type="button"
          onClick={() => onSetMode({ type: "confirm-delete", targetNode: node })}
          className="flex w-full items-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={12} />
          ลบพื้นที่
        </button>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────
function DeleteConfirmModal({
  node, allNodes, onDeleted, onClose,
}: {
  node: SpatialNode;
  allNodes: SpatialNode[];
  onDeleted: (nodeId: string) => void;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subAreas = allNodes.filter((n) => n.parentId === node.id);
  const typeKey = node.type as SpatialNodeType;
  const label = AREA_TYPE_LABELS[typeKey] ?? node.type;
  const colorClass = NODE_TYPE_COLORS[typeKey] ?? "bg-slate-100 text-slate-600";

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteSpatialNode(node.id);
      onDeleted(node.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบล้มเหลว");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">ยืนยันการลบพื้นที่</h2>
              <p className="text-xs text-slate-400">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${colorClass}`}>{label}</span>
              <span className="text-sm font-semibold text-slate-800">{node.name}</span>
            </div>
          </div>

          {subAreas.length > 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-start gap-2 text-xs text-amber-700">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>
                  พื้นที่นี้มี <strong>{subAreas.length} พื้นที่ย่อย</strong> ที่จะถูกลบพร้อมกันด้วย
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {deleting ? "กำลังลบ…" : "ยืนยันลบ"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared helpers ────────────────────────────────────────────────────────
function ActionBtn({
  icon, label, onClick, highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
        highlight
          ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-medium text-slate-500 shrink-0">{label}</span>
      <span className="text-xs font-semibold text-slate-800 text-right">{value}</span>
    </div>
  );
}

function EmptyDetail({ nodeCount, onAddArea }: { nodeCount: number; onAddArea: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      {nodeCount === 0 ? (
        <>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Layers size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">ยังไม่มีพื้นที่</p>
          <p className="mt-1 text-xs text-slate-400 max-w-[200px]">
            กดปุ่ม "เพิ่มพื้นที่" เพื่อสร้าง Site หรือ Building แรก
          </p>
          <button
            type="button"
            onClick={onAddArea}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus size={13} /> เพิ่มพื้นที่
          </button>
        </>
      ) : (
        <>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <MapPin size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">เลือกพื้นที่</p>
          <p className="mt-1 text-xs text-slate-400">
            คลิกพื้นที่ในโครงสร้างพื้นที่เพื่อดูรายละเอียด
          </p>
        </>
      )}
    </div>
  );
}
