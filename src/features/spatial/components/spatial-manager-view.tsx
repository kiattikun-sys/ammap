"use client";

import { useEffect, useState } from "react";
import { listSpatialNodes } from "@/domains/spatial/queries/list-spatial-nodes";
import type { SpatialNode } from "@/domains/spatial/model/spatial-node";
import { SpatialTree } from "./spatial-tree";
import {
  NODE_TYPE_LABELS,
  NODE_TYPE_COLORS,
} from "@/domains/spatial/services/spatial-drawing-service";
import type { SpatialNodeType } from "@/domains/spatial/model/spatial-node";
import { MapPin, Layers, ChevronRight } from "lucide-react";

interface SpatialManagerViewProps {
  projectId: string;
}

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
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load nodes"))
      .finally(() => setLoading(false));
  }, [projectId]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left panel — tree */}
      <div className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              {error}
            </div>
          </div>
        ) : (
          <SpatialTree
            projectId={projectId}
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onNodesChange={setNodes}
          />
        )}
      </div>

      {/* Right panel — node detail */}
      <div className="flex flex-1 flex-col overflow-auto bg-slate-50">
        {selectedNode ? (
          <NodeDetailPanel node={selectedNode} allNodes={nodes} />
        ) : (
          <EmptyDetail nodeCount={nodes.length} />
        )}
      </div>
    </div>
  );
}

function NodeDetailPanel({
  node,
  allNodes,
}: {
  node: SpatialNode;
  allNodes: SpatialNode[];
}) {
  const typeKey = node.type as SpatialNodeType;
  const label = NODE_TYPE_LABELS[typeKey] ?? node.type;
  const colorClass = NODE_TYPE_COLORS[typeKey] ?? "bg-slate-100 text-slate-600";

  const parent = node.parentId ? allNodes.find((n) => n.id === node.parentId) : null;
  const children = allNodes.filter((n) => n.parentId === node.id);

  return (
    <div className="mx-auto w-full max-w-xl p-6">
      {/* Breadcrumb */}
      {parent && (
        <div className="mb-3 flex items-center gap-1 text-xs text-slate-400">
          <span>{NODE_TYPE_LABELS[parent.type as SpatialNodeType]}</span>
          <ChevronRight size={11} />
          <span className="font-medium text-slate-600">{parent.name}</span>
        </div>
      )}

      {/* Node header */}
      <div className="mb-6 flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${colorClass}`}>
          {label[0]}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{node.name}</h1>
          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
            {label}
          </span>
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MetaCard label="Type" value={label} />
        <MetaCard label="Order" value={String(node.order)} />
        <MetaCard label="Has Geometry" value={node.geometry ? "Yes" : "No"} />
        <MetaCard label="Children" value={String(children.length)} />
        <MetaCard label="Created" value={node.createdAt.toLocaleDateString("en-CA")} />
        <MetaCard label="Updated" value={node.updatedAt.toLocaleDateString("en-CA")} />
      </div>

      {/* Children list */}
      {children.length > 0 && (
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Child Nodes ({children.length})
          </h2>
          <div className="space-y-1.5">
            {children
              .sort((a, b) => a.order - b.order)
              .map((child) => {
                const childType = child.type as SpatialNodeType;
                return (
                  <div
                    key={child.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${NODE_TYPE_COLORS[childType] ?? "bg-slate-100 text-slate-500"}`}>
                      {NODE_TYPE_LABELS[childType]?.[0] ?? "?"}
                    </span>
                    <span className="text-sm font-medium text-slate-800">{child.name}</span>
                    <span className="ml-auto text-[10px] text-slate-400">
                      {NODE_TYPE_LABELS[childType]}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function EmptyDetail({ nodeCount }: { nodeCount: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
      {nodeCount === 0 ? (
        <>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Layers size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">No spatial nodes yet</p>
          <p className="mt-1 text-xs text-slate-400 max-w-xs">
            Use the tree panel to add your first Site or Building
          </p>
        </>
      ) : (
        <>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <MapPin size={24} className="text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Select a node</p>
          <p className="mt-1 text-xs text-slate-400">
            Click any node in the tree to view its details
          </p>
        </>
      )}
    </div>
  );
}
