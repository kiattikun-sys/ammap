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
import { getSpatialNodeImpact } from "@/domains/spatial/actions/get-spatial-node-impact";
import type { SpatialNodeImpact } from "@/domains/spatial/actions/get-spatial-node-impact";
import type { SpatialTreeNode } from "@/domains/spatial/queries/get-spatial-tree";

interface SpatialManagerViewProps {
  projectId: string;
}

// ─── Inline flash feedback ───────────────────────────────────────────────────
interface FlashMessage {
  text: string;
  kind: "success" | "error";
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
  const [flash, setFlash] = useState<FlashMessage | null>(null);

  function showFlash(text: string, kind: FlashMessage["kind"] = "success") {
    setFlash({ text, kind });
    setTimeout(() => setFlash(null), 3000);
  }

  function handleNodeCreated(node: SpatialNode) {
    setNodes((prev) => [...prev, node]);
    setSelectedNodeId(node.id);
    showFlash(`สร้าง "${node.name}" เรียบร้อยแล้ว`);
  }

  function handleNodeUpdated(node: SpatialNode) {
    setNodes((prev) => prev.map((n) => (n.id === node.id ? node : n)));
    showFlash(`อัปเดต "${node.name}" เรียบร้อยแล้ว`);
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
        flash={flash}
        onDeleteSuccess={() => showFlash("ลบพื้นที่เรียบร้อยแล้ว")}
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
  flash: FlashMessage | null;
  onDeleteSuccess: () => void;
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
  flash,
  onDeleteSuccess,
}: InnerProps) {
  const { map, isLoaded } = useMap();
  const [drawState, setDrawState] = useState<DrawState | null>(null);
  const drawStateRef = useRef<DrawState | null>(null);
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

  // ── Keep drawStateRef current so effects can access latest drawState ──
  useEffect(() => { drawStateRef.current = drawState; }, [drawState]);

  // ── Drawing mode effects ───────────────────────────────────────────────
  // Deps include full mode object so switching from node A to node B in
  // the same mode type (e.g. adding-location) correctly restarts drawing.
  useEffect(() => {
    const ds = drawStateRef.current;
    if (!ds) return;
    if (mode.type === "adding-location") {
      // Fresh draw — no existing geometry to load
      ds.onStartDrawing(mode.targetNode.type as SpatialNodeType);
    } else if (mode.type === "editing-location") {
      if (mode.targetNode.geometry) {
        // True edit — load existing geometry into draw for vertex editing
        ds.onStartEditing(mode.targetNode.type as SpatialNodeType, mode.targetNode.geometry);
      } else {
        // Node has no geometry yet (shouldn't reach here via UI, but safe fallback)
        ds.onStartDrawing(mode.targetNode.type as SpatialNodeType);
      }
    }
  // mode is the full discriminated union — changing targetNode while staying
  // in the same mode type produces a new object reference and re-runs this effect.
  }, [mode]);

  // ── Cancel draw when mode returns to idle ─────────────────────────────
  // Use a separate effect so saving (which calls onNodeUpdated then setMode idle)
  // does NOT cancel the draw mid-save — we only cancel on explicit idle transitions
  // that are not triggered by a completed save.
  const prevModeTypeRef = useRef<PageMode["type"]>("idle");
  useEffect(() => {
    const prev = prevModeTypeRef.current;
    prevModeTypeRef.current = mode.type;
    // Only cancel if we transitioned away from a drawing mode to idle
    const wasDrawing = prev === "adding-location" || prev === "editing-location";
    if (wasDrawing && mode.type === "idle") {
      drawStateRef.current?.onCancelDrawing();
    }
  }, [mode.type]);

  // ── assignToNode: snapshot the target node at the time drawing starts ──
  // We read from mode directly so the controller always gets the exact node
  // the user clicked, even if selectedNode changes while drawing.
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
          onDrawStateChange={(state) => { setDrawState(state); drawStateRef.current = state; }}
          onNodeCreated={(node) => { setMode({ type: "idle" }); onNodeCreated(node); }}
          onNodeUpdated={(node) => { setMode({ type: "idle" }); onNodeUpdated(node); }}
          assignToNode={assignToNode}
        />
      </div>

      {/* ── RIGHT: Area Details ────────────────────────────────────────── */}
      <div className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white overflow-y-auto">
        {/* Flash feedback banner */}
        {flash && (
          <div className={`mx-3 mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
            flash.kind === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {flash.kind === "success" ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {flash.text}
          </div>
        )}
        {selectedNode ? (
          <AreaDetailPanel
            node={selectedNode}
            allNodes={nodes}
            onNodesChange={onNodesChange}
            onSelectNode={onSelectNode}
            onSetMode={setMode}
            onViewOnMap={handleViewOnMap}
            onDeleteSuccess={onDeleteSuccess}
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
            onDeleteSuccess();
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
  onDeleteSuccess: () => void;
}

// Build full ancestor path for breadcrumb
function buildAncestorPath(nodeId: string, allNodes: SpatialNode[]): SpatialNode[] {
  const path: SpatialNode[] = [];
  let current = allNodes.find((n) => n.id === nodeId);
  while (current?.parentId) {
    const parent = allNodes.find((n) => n.id === current!.parentId);
    if (!parent) break;
    path.unshift(parent);
    current = parent;
  }
  return path;
}

function AreaDetailPanel({ node, allNodes, onSelectNode, onSetMode, onViewOnMap }: AreaDetailPanelProps) {
  const typeKey = node.type as SpatialNodeType;
  const label = AREA_TYPE_LABELS[typeKey] ?? node.type;
  const colorClass = NODE_TYPE_COLORS[typeKey] ?? "bg-slate-100 text-slate-600";
  const hasLocation = Boolean(node.geometry);

  const ancestors = buildAncestorPath(node.id, allNodes);
  const subAreas = allNodes.filter((n) => n.parentId === node.id).sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-100 px-4 py-4">
        {/* Full hierarchy breadcrumb */}
        {ancestors.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-0.5 text-[10px] text-slate-400">
            {ancestors.map((anc, i) => (
              <span key={anc.id} className="flex items-center gap-0.5">
                {i > 0 && <ChevronRight size={9} />}
                <button
                  type="button"
                  onClick={() => onSelectNode(anc.id)}
                  className="font-medium hover:text-blue-500 hover:underline transition-colors"
                >
                  {anc.name}
                </button>
              </span>
            ))}
            <ChevronRight size={9} />
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
        {!hasLocation && (
          <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 leading-relaxed">
            พื้นที่นี้ยังไม่มีตำแหน่งบนแผนที่ กดปุ่ม <strong>กำหนดตำแหน่งบนแผนที่</strong> ด้านล่าง แล้ววาด polygon บนแผนที่
          </p>
        )}
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
  const [impact, setImpact] = useState<SpatialNodeImpact | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(true);
  // Explicitly track whether the impact query failed — null impact alone is ambiguous
  const [impactError, setImpactError] = useState(false);

  const subAreas = allNodes.filter((n) => n.parentId === node.id);
  const typeKey = node.type as SpatialNodeType;
  const label = AREA_TYPE_LABELS[typeKey] ?? node.type;
  const colorClass = NODE_TYPE_COLORS[typeKey] ?? "bg-slate-100 text-slate-600";

  // Load linked entity counts when modal opens
  useEffect(() => {
    setLoadingImpact(true);
    setImpactError(false);
    getSpatialNodeImpact(node.id)
      .then((data) => { setImpact(data); setImpactError(false); })
      .catch(() => { setImpact(null); setImpactError(true); })
      .finally(() => setLoadingImpact(false));
  }, [node.id]);

  const linkedCount = impact
    ? impact.workItemCount + impact.defectCount + impact.inspectionCount +
      impact.evidenceCount + impact.timelineEventCount + impact.progressRecordCount
    : 0;

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

          {/* Sub-area warning — backend blocks delete if children exist */}
          {subAreas.length > 0 && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="flex items-start gap-2 text-xs text-red-700">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>
                  <strong>ไม่สามารถลบได้:</strong> พื้นที่นี้มี{" "}
                  <strong>{subAreas.length} พื้นที่ย่อย</strong> ต้องลบพื้นที่ย่อยทั้งหมดก่อน
                </span>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loadingImpact && (
            <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
              <div className="h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-slate-500" />
              กำลังตรวจสอบข้อมูลที่เชื่อมโยง…
            </div>
          )}

          {/* Unknown / error state — never show "safe" when we cannot confirm */}
          {!loadingImpact && impactError && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-start gap-2 text-xs text-amber-700">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">ไม่สามารถตรวจสอบผลกระทบได้ครบถ้วน</p>
                  <p className="mt-0.5 text-amber-600">
                    ระบบไม่สามารถอ่านข้อมูลที่เชื่อมโยงได้ อาจมีข้อมูลงาน ข้อบกพร่อง
                    หรือหลักฐานที่จะสูญเสียการเชื่อมโยงกับพื้นที่นี้
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Linked data warning — backend uses ON DELETE SET NULL, data is NOT deleted */}
          {!loadingImpact && !impactError && impact && linkedCount > 0 && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-start gap-2 text-xs text-amber-700">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold">ข้อมูลต่อไปนี้จะยังคงอยู่ แต่จะไม่ถูกเชื่อมโยงกับพื้นที่นี้อีก:</p>
                  <ul className="space-y-0.5 pl-1">
                    {impact.workItemCount > 0 && (
                      <li>• งาน: <strong>{impact.workItemCount} รายการ</strong></li>
                    )}
                    {impact.defectCount > 0 && (
                      <li>• ข้อบกพร่อง: <strong>{impact.defectCount} รายการ</strong></li>
                    )}
                    {impact.inspectionCount > 0 && (
                      <li>• การตรวจสอบ: <strong>{impact.inspectionCount} รายการ</strong></li>
                    )}
                    {impact.evidenceCount > 0 && (
                      <li>• หลักฐาน: <strong>{impact.evidenceCount} รายการ</strong></li>
                    )}
                    {impact.timelineEventCount > 0 && (
                      <li>• เหตุการณ์ไทม์ไลน์: <strong>{impact.timelineEventCount} รายการ</strong></li>
                    )}
                    {impact.progressRecordCount > 0 && (
                      <li>• บันทึกความคืบหน้า: <strong>{impact.progressRecordCount} รายการ</strong></li>
                    )}
                  </ul>
                  <p className="text-amber-600">ข้อมูลจะยังคงอยู่ในระบบ แต่จะไม่ถูกเชื่อมโยงกับพื้นที่ใดๆ</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={deleting || subAreas.length > 0}
              onClick={handleDelete}
              className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {deleting ? "กำลังลบ…" : subAreas.length > 0 ? "ไม่สามารถลบได้" : "ยืนยันลบ"}
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
            กดปุ่ม &quot;เพิ่มพื้นที่&quot; เพื่อสร้าง Site หรือ Building แรก
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
